const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const { execSync } = require('child_process');

// Get command line arguments
const args = process.argv.slice(2);
const projectName = args[0] || 'shared'; // Default to 'shared' if no argument provided
const customRootDir = args[1]; // New parameter for custom root directory

// Configuration
const rootDir = customRootDir ? path.resolve(customRootDir) : path.resolve(__dirname, '../../');
const projectDir = path.resolve(rootDir, projectName);
const sourceDirectory = path.resolve(projectDir, 'src');
const outputDirectory = path.resolve(rootDir, 'docs/api', projectName);
const indexFile = path.resolve(outputDirectory, 'index.md');

console.log(`Generating documentation for ${projectName} module...`);
console.log(`Root directory: ${rootDir}`);
console.log(`Source directory: ${sourceDirectory}`);
console.log(`Output directory: ${outputDirectory}`);

// Ensure output directory exists
if (!fs.existsSync(outputDirectory)) {
  fs.mkdirSync(outputDirectory, { recursive: true });
}

// Helper function to extract the name of a node
function getNodeName(node) {
  if (!node) return 'Unnamed';

  // Handle different node types to extract names
  if (node.name && node.name.text) {
    return node.name.text;
  }
  
  // Handle property signatures in interfaces
  if (ts.isPropertySignature(node) && node.name) {
    if (ts.isIdentifier(node.name)) {
      return node.name.text;
    } else if (ts.isStringLiteral(node.name)) {
      return node.name.text;
    }
  }
  
  // Handle method signatures in interfaces
  if (ts.isMethodSignature(node) && node.name) {
    if (ts.isIdentifier(node.name)) {
      return node.name.text;
    }
  }
  
  // Handle parameter declarations
  if (ts.isParameter(node) && node.name) {
    if (ts.isIdentifier(node.name)) {
      return node.name.text;
    }
  }
  
  // Handle export declarations with named exports
  if (ts.isExportDeclaration(node) && node.exportClause) {
    if (ts.isNamedExports(node.exportClause)) {
      const names = node.exportClause.elements.map(e => e.name.text);
      return names.join(', ');
    }
  }
  
  // Handle variable declarations (especially for top-level variables)
  if (ts.isVariableStatement(node)) {
    if (node.declarationList && node.declarationList.declarations.length > 0) {
      const firstDeclaration = node.declarationList.declarations[0];
      if (firstDeclaration.name) {
        if (ts.isIdentifier(firstDeclaration.name)) {
          return firstDeclaration.name.text;
        }
      }
    }
  }
  
  // Handle variable declarations directly
  if (ts.isVariableDeclaration(node) && node.name) {
    if (ts.isIdentifier(node.name)) {
      return node.name.text;
    }
  }
  
  // Handle import declarations
  if (ts.isImportDeclaration(node)) {
    // For named imports, list the imported names
    if (node.importClause && node.importClause.namedBindings) {
      if (ts.isNamedImports(node.importClause.namedBindings)) {
        const names = node.importClause.namedBindings.elements.map(e => e.name.text);
        if (names.length > 0) {
          return `Import: ${names.join(', ')}`;
        }
      } else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
        return `Import as ${node.importClause.namedBindings.name.text}`;
      }
    }
    // For default imports
    if (node.importClause && node.importClause.name) {
      return `Import ${node.importClause.name.text}`;
    }
    // For module imports, use the module name
    if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      return `Import from '${node.moduleSpecifier.text}'`;
    }
  }
  
  return 'Unnamed';
}

// Helper function to parse JSDoc tags from a comment
function parseJSDocTags(commentText) {
  const tags = {};
  
  // Find all @tags in the comment
  const tagRegex = /@(\w+)\s+(?:{([^}]+)})?\s*(.*?)(?=\n\s*@|\n\s*\*\/|$)/gs;
  
  let match;
  while ((match = tagRegex.exec(commentText)) !== null) {
    const tagName = match[1];
    const tagType = match[2] || null;
    const tagText = match[3].trim();
    
    if (!tags[tagName]) {
      tags[tagName] = [];
    }
    
    tags[tagName].push({
      type: tagType,
      text: tagText
    });
  }
  
  return tags;
}

// Helper function to get the description from JSDoc comment (text before any tags)
function getJSDocDescription(commentText) {
  const descriptionRegex = /\/\*\*\s*([\s\S]*?)(?=\s*@|\s*\*\/)/;
  const match = commentText.match(descriptionRegex);
  
  if (match && match[1]) {
    return match[1]
      .replace(/^\s*\*\s?/gm, '')  // Remove leading * from each line
      .trim();
  }
  
  return '';
}

// Helper function to extract JSDoc comments from a TypeScript file
function extractJSDocComments(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    fileContent,
    ts.ScriptTarget.Latest,
    true
  );

  const jsDocs = [];

  function visit(node) {
    // Process property signatures within an interface
    if (ts.isInterfaceDeclaration(node)) {
      const interfaceName = node.name.text;
      
      // Visit the members of the interface
      if (node.members) {
        node.members.forEach(member => {
          if (member.jsDoc) {
            for (const jsDoc of member.jsDoc) {
              const start = jsDoc.pos;
              const end = jsDoc.end;
              const commentText = fileContent.substring(start, end);
              const memberName = getNodeName(member);
              
              jsDocs.push({
                text: commentText,
                name: memberName,
                parentName: interfaceName,
                kind: ts.SyntaxKind[member.kind],
                line: sourceFile.getLineAndCharacterOfPosition(member.pos).line + 1,
                description: getJSDocDescription(commentText),
                tags: parseJSDocTags(commentText)
              });
            }
          }
        });
      }
    }
    
    // Process other nodes with JSDoc
    if (node.jsDoc) {
      for (const jsDoc of node.jsDoc) {
        const start = jsDoc.pos;
        const end = jsDoc.end;
        const commentText = fileContent.substring(start, end);
        
        // Get the name of the node
        let name = getNodeName(node);
        
        // Special handling for "FirstStatement" - try to find the variable declaration
        if (name === 'Unnamed' && ts.SyntaxKind[node.kind] === 'FirstStatement') {
          // For first statements, look at the next statement to find variable names
          if (node.parent && ts.isSourceFile(node.parent)) {
            const statements = node.parent.statements;
            const currentIndex = statements.indexOf(node);
            
            if (currentIndex >= 0 && currentIndex + 1 < statements.length) {
              const nextStatement = statements[currentIndex + 1];
              
              // If the next statement is a variable declaration, use its name
              if (ts.isVariableStatement(nextStatement)) {
                const declaration = nextStatement.declarationList.declarations[0];
                if (declaration && declaration.name && ts.isIdentifier(declaration.name)) {
                  name = declaration.name.text;
                }
              } else if (ts.isExportDeclaration(nextStatement)) {
                // If it's an export declaration, try to get the exported name
                if (nextStatement.exportClause && ts.isNamedExports(nextStatement.exportClause)) {
                  const exportNames = nextStatement.exportClause.elements.map(e => e.name.text);
                  if (exportNames.length > 0) {
                    name = exportNames.join(', ');
                  }
                }
              }
            }
          }
        }
        
        jsDocs.push({
          text: commentText,
          name: name,
          kind: ts.SyntaxKind[node.kind],
          line: sourceFile.getLineAndCharacterOfPosition(node.pos).line + 1,
          description: getJSDocDescription(commentText),
          tags: parseJSDocTags(commentText)
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return jsDocs;
}

// Helper function to extract __documentation exports
function extractDocumentationExports(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Simple regex to find __documentation export objects
    const docRegex = /export\s+const\s+__documentation\s*=\s*({[\s\S]*?});/g;
    const matches = [...fileContent.matchAll(docRegex)];
    
    if (matches.length === 0) return null;
    
    // Extract the object content for each match
    return matches.map(match => {
      const objectContent = match[1];
      
      // We'll return the raw text for now
      return {
        raw: objectContent,
        filePath: filePath
      };
    });
  } catch (error) {
    console.error(`Error extracting documentation from ${filePath}:`, error);
    return null;
  }
}

// Format JSDoc for better display
function formatJSDoc(jsDoc) {
  let formatted = `### ${jsDoc.name} (${jsDoc.kind})`;
  
  if (jsDoc.parentName) {
    formatted += ` in ${jsDoc.parentName}`;
  }
  
  formatted += '\n\n';
  
  // Add the description
  if (jsDoc.description) {
    formatted += `${jsDoc.description}\n\n`;
  }
  
  // Format tags
  if (jsDoc.tags && Object.keys(jsDoc.tags).length > 0) {
    formatted += '**Tags:**\n\n';
    
    for (const [tagName, tagValues] of Object.entries(jsDoc.tags)) {
      for (const tag of tagValues) {
        formatted += `- @${tagName}`;
        
        if (tag.type) {
          formatted += ` \`{${tag.type}}\``;
        }
        
        if (tag.text) {
          formatted += ` ${tag.text}`;
        }
        
        formatted += '\n';
      }
    }
    
    formatted += '\n';
  }
  
  // Add the original JSDoc text as code block
  formatted += '```typescript\n';
  formatted += jsDoc.text;
  formatted += '\n```\n\n';
  
  return formatted;
}

// Recursively process files in a directory
function processDirectory(dirPath, relativePath = '') {
  if (!fs.existsSync(dirPath)) {
    console.warn(`Directory does not exist: ${dirPath}`);
    return [];
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  let docsContent = [];
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const entryRelativePath = path.join(relativePath, entry.name);
    
    if (entry.isDirectory()) {
      // Create directory in output
      const outputSubdir = path.join(outputDirectory, relativePath, entry.name);
      if (!fs.existsSync(outputSubdir)) {
        fs.mkdirSync(outputSubdir, { recursive: true });
      }
      
      // Process subdirectory
      const subdirDocs = processDirectory(fullPath, entryRelativePath);
      if (subdirDocs.length > 0) {
        // Create index file for subdirectory
        const subIndexPath = path.join(outputDirectory, relativePath, entry.name, 'index.md');
        fs.writeFileSync(
          subIndexPath,
          `# ${entry.name} Documentation\n\n` +
          `This directory contains documentation for the \`${entryRelativePath}\` module.\n\n` +
          `## Contents\n\n` +
          subdirDocs.map(doc => `- [${doc.name}](${doc.name}.md)`).join('\n') +
          '\n'
        );
        
        docsContent.push({
          name: entry.name,
          path: entryRelativePath,
          isDirectory: true
        });
      }
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      // Process TypeScript file
      const jsDocs = extractJSDocComments(fullPath);
      const docExports = extractDocumentationExports(fullPath);
      
      if ((jsDocs && jsDocs.length > 0) || (docExports && docExports.length > 0)) {
        // Generate documentation for this file
        const moduleName = path.basename(entry.name, '.ts');
        const outputFilePath = path.join(outputDirectory, relativePath, `${moduleName}.md`);
        
        let fileContent = `# ${moduleName} Module\n\n`;
        fileContent += `File: \`${entryRelativePath}\`\n\n`;
        
        // Add JSDoc comments
        if (jsDocs && jsDocs.length > 0) {
          fileContent += `## JSDoc Documentation\n\n`;
          
          for (const doc of jsDocs) {
            fileContent += formatJSDoc(doc);
          }
        }
        
        // Add __documentation exports
        if (docExports && docExports.length > 0) {
          fileContent += `## Module Documentation\n\n`;
          
          for (const doc of docExports) {
            fileContent += `\`\`\`json\n${doc.raw}\n\`\`\`\n\n`;
          }
        }
        
        fs.writeFileSync(outputFilePath, fileContent);
        
        docsContent.push({
          name: moduleName,
          path: path.join(relativePath, `${moduleName}.md`),
          isFile: true
        });
      }
    }
  }
  
  return docsContent;
}

// Process all files in the source directory
const allDocs = processDirectory(sourceDirectory);

// Generate index file
let indexContent = `# ${projectName.charAt(0).toUpperCase() + projectName.slice(1)} Module Documentation\n\n`;
indexContent += `This documentation is auto-generated from JSDoc comments and \`__documentation\` exports in the source code.\n\n`;
indexContent += `Generated on: ${new Date().toISOString()}\n\n`;
indexContent += `## Module Structure\n\n`;

// Add directory tree
function addDirectoryTree(docs, indent = '') {
  let treeContent = '';
  
  for (const doc of docs) {
    if (doc.isDirectory) {
      treeContent += `${indent}- 📁 [${doc.name}/](${doc.path}/index.md)\n`;
    } else if (doc.isFile) {
      treeContent += `${indent}- 📄 [${doc.name}.ts](${doc.path})\n`;
    }
  }
  
  return treeContent;
}

indexContent += addDirectoryTree(allDocs);

// Write index file
fs.writeFileSync(indexFile, indexContent);

console.log(`Documentation generated successfully in ${outputDirectory}`); 