const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

const extensionTemplatesPath = path.join(__dirname, 'templates');

const getProperty = (obj, prop, deflt) => { return obj.hasOwnProperty(prop) ? obj[prop] : deflt; };

const workspaceFolder2TemplateDirFolder = wsf => ({ label: `  $(folder) Folder: ${wsf.name}`, uri: vscode.Uri.file(path.join(wsf.uri.fsPath, '.vscode', 'templates')) });

function pathExists(path) { return fs.existsSync(path); }
function pathIsDirectory(path) { return pathExists(path) && fs.statSync(path).isDirectory(); }
function pathIsFile(path) { return pathExists(path) && fs.statSync(path).isFile(); }
function createDirectory(path) { if (!pathExists(path)) { fs.mkdirSync(path, { recursive: true } ); } }
function removeThemeIcon(text) { return text.replace(/\$\([-\w]+\)/g, ''); }
const nonPosixPathRegEx = new RegExp('^/([a-zA-Z]):/');
const lowerCaseDriveLetter = p => p.replace(nonPosixPathRegEx, match => match.toLowerCase() );

function withTemplateDirs(action) {
  if (vscode.workspace.workspaceFolders === undefined) {
    vscode.window.showErrorMessage('No workspace open');
    return;
  }
  let config = vscode.workspace.getConfiguration('templates', vscode.workspace.workspaceFolders[0].uri);
  let inspect = config.inspect('folder') || {};
  let templateDirs = {};
  if (inspect.globalValue) {
    templateDirs.global = { label: '  $(home) User', uri: vscode.Uri.file(inspect.globalValue) }
  }
  if ((vscode.workspace.workspaceFolders.length > 1) && inspect.workspaceValue) {
    templateDirs.workspace = { label: `  $(list-tree) Workspace: ${vscode.workspace.name.replace(' (Workspace)', '')} `, uri: vscode.Uri.file(inspect.workspaceValue) }
  }
  templateDirs.folders = vscode.workspace.workspaceFolders.map( wsf => workspaceFolder2TemplateDirFolder(wsf) );
  action(templateDirs);
}

function getTemplates(templateDirs, override = false) {
  return new Promise( (resolve) => {
    let templates = [];
    let updateTemplates = (templateDir, sequence) => {
      if (!templateDir) { return; }
      let dirPath = templateDir.uri.fsPath;
      if (!pathIsDirectory(dirPath)) { return; }
      let files = fs.readdirSync(dirPath);
      files.forEach((file, index) => {
        if (file === 'file-variables.txt') { index = 10000; } // when will get an issue by somebody who has that many templates defined
        if (override) { templates = templates.filter( t => t.label !== file); }
        templates.push( {label: file, description: templateDir.label, filePath: path.join(dirPath, file), sort: [sequence, index] } );
      });
    };
    let numFolders = templateDirs.folders.length;
    updateTemplates(templateDirs.extension, 2 + numFolders);
    updateTemplates(templateDirs.global, 1 + numFolders);
    updateTemplates(templateDirs.workspace, 0 + numFolders);
    templateDirs.folders.forEach( updateTemplates );
    templates.sort( (a,b) => {
      if ( a.sort[0] < b.sort[0]) return -1;
      if ( a.sort[0] > b.sort[0]) return 1;
      return a.sort[1] - b.sort[1];
    });
    resolve(templates);
  });
}

function editTemplate() {
  withTemplateDirs( templateDirs => {
    getTemplates(templateDirs)
      .then(templatesInfo => {
        if (templatesInfo.length === 0) {
          vscode.window.showInformationMessage('No templates found.');
          return;
        }
        return vscode.window.showQuickPick(templatesInfo, { placeHolder: 'Select a template to edit' });
      })
      .then(templateInfo => {
        if (!templateInfo) { return; }
        vscode.commands.executeCommand('vscode.open', vscode.Uri.file(templateInfo.filePath));
      });
  });
}

const NEW_FILE = 'Files: New File';
// const CREATE_TEMPLATE = 'Files: New File Template';
// const EDIT_TEMPLATE = 'Files: Edit File Template';
// const TEMPLATES_PREFIX = 'Template: ';
const cursorVar = '${cursor}';

// String.prototype.replaceAll = function(search, replacement) {
//   return this.replace(new RegExp(search, 'g'), replacement);
// };

const dateTimeFormat = (args, parentArgs) => {
  let getPropertyEx = (obj, prop, parentObj) => getProperty(obj, prop, getProperty(parentObj, prop, undefined));
  let locale = getPropertyEx(args, 'locale', parentArgs);
  let options = getPropertyEx(args, 'options', parentArgs);
  let template = getPropertyEx(args, 'template', parentArgs);
  let parts = new Intl.DateTimeFormat(locale, options).formatToParts(new Date());
  if (!template) { return parts.map(({type, value}) => value).join(''); }
  let dateTimeFormatParts = {};
  parts.forEach(({type, value}) => { dateTimeFormatParts[type] = value; });
  return template.replace(/\$\{(\w+)\}/g, (match, p1) => { return getProperty(dateTimeFormatParts, p1, ''); });
};

function getAuthor(config) {
  let author = config.get('Author');
  if (author !== 'Author') return author;  // still using the old name
  return config.get('author');
}

function getVariableWithParamsRegex(varName, flags) { return new RegExp(`\\$\\{${varName}(\\}|([^a-zA-Z{}$]+)(.+?)\\2\\})`, flags); }

async function gotoCursor(editor, offsetCursor = -1) {
  let document = editor.document;
  if (offsetCursor === -1) {
    offsetCursor = document.getText().indexOf(cursorVar);
    if (offsetCursor >= 0) {
      let start = document.positionAt(offsetCursor);
      await editor.edit( editBuilder => { editBuilder.replace(new vscode.Range(start, start.translate(0, cursorVar.length)), ''); });
    }
  }
  if (offsetCursor >= 0) {
    let start = document.positionAt(offsetCursor);
    editor.selections = [ new vscode.Selection(start,start) ];
  }
}

function createFile(filepath, data = '', fileExtname = '') {
  vscode.window.showInputBox({ prompt: 'Enter new file name' + (fileExtname.length !==0 ? ' (without extension)' : '') })
    .then(fileBasenameNoExtension => {
      if (!fileBasenameNoExtension) { return; }
      let fileBasename = fileBasenameNoExtension + fileExtname;
      let curDir = filepath;
      if (!pathIsDirectory(filepath))
        curDir = path.dirname(filepath);

      let newFilePath = path.join(curDir, fileBasename);
      if (pathIsFile(newFilePath)) {
        vscode.window.showErrorMessage(`File already exists: ${newFilePath}`);
        return;
      }
      let newFileURI = vscode.Uri.file(newFilePath);
      let workspaceURI = vscode.workspace.getWorkspaceFolder(newFileURI).uri; // should always have a result
      let relativeFile = 'Unknown';
      let relativeFileDirname = relativeFile;
      if (lowerCaseDriveLetter(newFileURI.path).indexOf(lowerCaseDriveLetter(workspaceURI.path)) === 0) { relativeFile = newFileURI.path.substring(workspaceURI.path.length+1); }
      let pos = relativeFile.lastIndexOf(fileBasename);
      if (pos !== -1) { relativeFileDirname = relativeFile.substring(0, pos); }
      if (relativeFileDirname.endsWith('/')) { relativeFileDirname = relativeFileDirname.substring(0, relativeFileDirname.length-1); }

      let config = vscode.workspace.getConfiguration('templates', newFileURI);
      data = data.replace(/\$\{author\}/ig, getAuthor(config));  // config.get('author'));
      data = data.replace(/\$\{date\}/ig, new Date().toDateString());
      data = data.replace(getVariableWithParamsRegex('dateTimeFormat', 'g'), (m, p1, p2, p3) => {
        let dateConfig = config.get('dateTimeFormat');
        return dateTimeFormat(p3 ? getProperty(dateConfig, p3, {}) : dateConfig, p3 ? dateConfig : {});
      });
      data = data.replace(/\$\{fileBasename\}/g, fileBasename);
      data = data.replace(/\$\{fileBasenameNoExtension\}/g, fileBasenameNoExtension);
      data = data.replace(/\$\{fileExtname\}/g, fileExtname);
      data = data.replace(/\$\{relativeFile\}/g, relativeFile);
      data = data.replace(/\$\{relativeFileDirname\}/g, relativeFileDirname);
      // for historic reasons
      data = data.replace(/\$\{file\}/ig, fileBasename);

      let offsetCursor = -1;
      if (!getVariableWithParamsRegex('(?:input|snippet)').test(data)) {
        offsetCursor = data.indexOf(cursorVar);
        data = data.replace(/\$\{cursor\}/g, '');
      }

      fs.writeFile(newFilePath, data, (err) => {
        if (err) {
          vscode.window.showErrorMessage(`Cannot create new file: ${newFilePath}`);
          return;
        }
        vscode.commands.executeCommand('vscode.open', newFileURI)
          .then( async () => {
            let editor = vscode.window.activeTextEditor;
            if (!editor) { return; }
            let document = editor.document;
            if (lowerCaseDriveLetter(document.uri.path) !== lowerCaseDriveLetter(newFileURI.path)) { return; }

            let inputVarRegEx = getVariableWithParamsRegex('input');
            while (true) {
              let found = document.getText().match(inputVarRegEx);
              if (!found) { break; }
              let start = document.positionAt(found.index);
              let varRange = new vscode.Range(start, start.translate(0, found[0].length));
              let input = await vscode.window.showInputBox({ prompt: found[3] });
              if (input === undefined) { break; }
              await editor.edit( editBuilder => { editBuilder.replace(varRange, input); });
            }
            if (getVariableWithParamsRegex('snippet').test(document.getText())) { return; }
            gotoCursor(editor, offsetCursor);
          });
      });
    });
}

function nextSnippet(editor, edit, args) {
  let document = editor.document;
  let found = document.getText().match(getVariableWithParamsRegex('snippet'));
  if (found) {
    let start = document.positionAt(found.index);
    let varRange = new vscode.Range(start, start.translate(0, found[0].length));
    return editor.insertSnippet(new vscode.SnippetString(found[3]), varRange);
  }
  return gotoCursor(editor);
}

var getWorkspaceFolder = async (folders) => {
  if (folders.length === 1) { return folders[0]; }
  return vscode.window.showQuickPick(folders, { placeHolder: 'Select a folder to place file' })
    .then( folder => {
      if (!folder) return undefined;
      return folder;
    });
};

async function getCurrentPath_TemplateDirFolder(uri, templateDirs) {
  let currentURI = uri;
  if (!currentURI) {
    let editor = vscode.window.activeTextEditor;
    if (editor) { currentURI = editor.document.uri; }
  }
  if (!currentURI) {
    let templateDirFolder = await getWorkspaceFolder(templateDirs.folders);
    if (templateDirFolder) { currentURI = vscode.Uri.file(path.dirname(path.dirname(templateDirFolder.uri.fsPath))); }  // remove '/.vscode/templates' OS independent
  }
  let currentPath = undefined;
  let templateDirFolder = undefined;
  if (currentURI) {
    let workspace = vscode.workspace.getWorkspaceFolder(currentURI);
    if (workspace) {
      currentPath = currentURI.fsPath;
      templateDirFolder = workspaceFolder2TemplateDirFolder(workspace);
    } else {
      vscode.window.showErrorMessage('Current file not part of workspace.');
    }
  }
  return {currentPath, templateDirFolder};
  // TODO : create untitled file from template
}

async function newFileFromTemplate(uri) {
  withTemplateDirs(async (templateDirs) => {
    let {currentPath, templateDirFolder} = await getCurrentPath_TemplateDirFolder(uri, templateDirs);
    if (!currentPath) return;
    templateDirs.extension = { label: '  $(extensions) Extension', uri: vscode.Uri.file(extensionTemplatesPath) };
    templateDirs.folders = [ templateDirFolder ];
    let override = true;
    getTemplates(templateDirs, override)
      .then(templatesInfo => {
        templatesInfo.unshift( { label: NEW_FILE } );
        // [{label:CREATE_TEMPLATE}, {label:EDIT_TEMPLATE}]
        return vscode.window.showQuickPick(templatesInfo, { placeHolder: 'Select a template to create from' });
      })
      .then(templateInfo => {
        if (!templateInfo) { return; }

        if (!templateInfo.filePath) {
          // if(templateInfo.label === CREATE_TEMPLATE)
          //   newTemplate();
          // else if(templateInfo.label === EDIT_TEMPLATE){
          //   editTemplate();
          // }
          if (templateInfo.label === NEW_FILE)
            createFile(currentPath);
          return;
        }

        fs.readFile(templateInfo.filePath, 'utf8', (err, data) => {
          if (err) {
            vscode.window.showErrorMessage('Cannot find the template');
            return;
          }
          let extension = templateInfo.filePath.substring(templateInfo.filePath.lastIndexOf('.'));
          createFile(currentPath, data, extension);
        });
      });
  });
}

function createTemplate(templateText = '') {
  withTemplateDirs( templateDirs => {
    let folders = [...templateDirs.folders];
    if (templateDirs.workspace) { folders.push(templateDirs.workspace); }
    if (templateDirs.global)    { folders.push(templateDirs.global); }
    vscode.window.showQuickPick(folders, { placeHolder: 'Select a folder to place template' })
      .then( folder => {
        if (!folder) { return };
        vscode.window.showInputBox({ prompt: 'Enter template name with extension. (Ex: javascript.js)' })
          .then(templateName => {
            if (!templateName) { return; }
            getTemplates( {folders: [folder]} ).then(templatesInfo => {
              if (templatesInfo.find(t => t.label === templateName) !== undefined) {
                vscode.window.showErrorMessage(`${removeThemeIcon(folder.label)}: Template \"${templateName}\" already exists.`);
                return;
              }
              let templateDirPath = folder.uri.fsPath;
              createDirectory(templateDirPath);
              if (!pathIsDirectory(templateDirPath)) {
                vscode.window.showErrorMessage(`Unable to create directory or path is not a directory: ${templateDirPath}`);
                return;
              }
              let templatePath = path.join(templateDirPath, templateName);
              fs.writeFile(templatePath, templateText, (err) => {
                if (err) {
                  vscode.window.showErrorMessage(err);
                  return;
                }
                vscode.window.showInformationMessage(`${removeThemeIcon(folder.label)}: ${templateName} created.`);
                vscode.commands.executeCommand('vscode.open', vscode.Uri.file(templatePath));
              });
            });
          });
      });
  });
}

function newTemplateFromFile() {
  let editor = vscode.window.activeTextEditor;
  createTemplate(editor.document.getText());
}

function newTemplate() {
  createTemplate();
}

function activate(context) {
  context.subscriptions.push(vscode.commands.registerCommand('templates.newTemplateFromFile', newTemplateFromFile));
  context.subscriptions.push(vscode.commands.registerCommand('templates.newTemplate', newTemplate));
  context.subscriptions.push(vscode.commands.registerCommand('templates.editTemplate', editTemplate));
  context.subscriptions.push(vscode.commands.registerCommand('templates.newFileFromTemplate', newFileFromTemplate));
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('templates.nextSnippet', nextSnippet));
}

function deactivate() { }

module.exports = {
  activate,
  deactivate
}
