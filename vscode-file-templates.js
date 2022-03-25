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
  let inspect = config.inspect('folder');
  if (inspect === undefined) { inspect = {key:undefined}; }
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

/** @returns {Promise<{label: string, description?: string, filePath?: string}[]>} */
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
const cursorVar = '${cursor}';

// String.prototype.replaceAll = function(search, replacement) {
//   return this.replace(new RegExp(search, 'g'), replacement);
// };

const dateTimeFormat = (...argsList) => {
  let getPropertyEx = (objList, prop) => {
    for (const obj of objList) {
      let v = getProperty(obj, prop, undefined);
      if (v !== undefined) { return v; }
    }
    return undefined;
  };
  let locale = getPropertyEx(argsList, 'locale');
  let options = getPropertyEx(argsList, 'options');
  let template = getPropertyEx(argsList, 'template');
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

function getVariableWithParamsRegex(varName, flags) { return new RegExp(`\\$\\{${varName}(\\}|([^a-zA-Z{}$]+)([\\s\\S]+?)\\2\\})`, flags); }

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
    var range = new vscode.Range(editor.selection.start, editor.selection.start);
    editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
  }
}

class FindProperties {
  constructor() {
    this.find = '(.*)';
    this.replace = '$1';
    this.flags = undefined;
  }
}

class VariableProperties {
  constructor(regexMatch) {
    this.regexMatch = regexMatch;
    this.name = undefined;
    /** @type {FindProperties[]} finds */
    this.finds = [];
    this.currentFind = undefined;
  }
  init() {
    if (this.regexMatch[2] === undefined) { return; }
    let properties = this.regexMatch[3].split(this.regexMatch[2]).map(s => s.trimStart());
    let propIndex = this.getPropIndex(properties);
    for (; propIndex < properties.length; propIndex++) {
      const [key,...parts] = properties[propIndex].split('=');
      const value = parts.length > 0 ? parts.join('=') : undefined;
      if (key === 'name') { this.name = value; continue; }
      if (key === 'find') {
        this.createNewFind()
        this.currentFind.find = value;
        continue;
      }
      if (key === 'flags') {
        this.createNewFindIfNotFound();
        this.currentFind.flags = value;
        continue;
      }
      if (key === 'replace') {
        this.createNewFindIfNotFound();
        this.currentFind.replace = value;
        continue;
      }
      this.setProperty(key, value);
    }
  }
  createNewFind() {
    this.currentFind = new FindProperties();
    this.finds.push(this.currentFind);
  }
  createNewFindIfNotFound() {
    if (!this.currentFind) {
      this.createNewFind()
    }
  }
  /** @param {string} input */
  transform(input) {
    let result = input;
    for (const find of this.finds) {
      result = result.replace(new RegExp(find.find, find.flags), find.replace);
    }
    return result;
  }
  /** @param {string[]} properties @returns {number} */
  getPropIndex(properties) { throw 'Not Implemented'; }
  setProperty(key, value) {}
}

class VariableTransformProperties extends VariableProperties {
  constructor(regexMatch) {
    super(regexMatch);
    this.init();
  }
  /** @param {string[]} properties @returns {number} */
  getPropIndex(properties) { return 0; }
}

class DateTimeFormatProperties extends VariableProperties {
  constructor(regexMatch) {
    super(regexMatch);
    this.config = {};
    this.nameConfig = {};
    this.init();
  }
  /** @param {string[]} properties @returns {number} */
  getPropIndex(properties) { return 0; }
  setProperty(key, value) {
    if (value === undefined) { this.name = key; return; }
    if (key === 'locale') { this.config.locale = value; return; }
    if (key === 'template') { this.config.template = value; return; }
    if (key === 'options') {
      try {
        this.config.options = JSON.parse(value);
      } catch {
        vscode.window.showErrorMessage('Error parsing "options" property of dateTimeFormat variable. Invalid JSON.');
      }
      return;
    }
  }
}

class InputVariableProperties extends VariableProperties {
  constructor(regexMatch) {
    super(regexMatch);
    this.description = 'Enter text';
    this.init();
  }
  /** @param {string[]} properties @returns {number} */
  getPropIndex(properties) {
    let propIndex = 1; // skip description
    if (properties[0].startsWith('name=')) {
      propIndex = 0;
    } else {
      this.description = properties[0];
    }
    return propIndex;
  }
}

class SnippetVariableProperties extends VariableProperties {
  constructor(regexMatch) {
    super(regexMatch);
    this.snippet = '';
    this.hasUI = true;
    this.init();
  }
  /** @param {string[]} properties @returns {number} */
  getPropIndex(properties) {
    let propIndex = 1; // skip description
    this.snippet = properties[0];
    return propIndex;
  }
  setProperty(key, value) {
    if (key === 'noUI') { this.hasUI = false; return; }
  }
}

/** @param {vscode.TextEditor} editor @param {RegExpMatchArray} regexMatch */
async function processInputVariable(editor, regexMatch) {
  let inputVars = [ new InputVariableProperties(regexMatch) ];
  let input = await vscode.window.showInputBox({ prompt: inputVars[0].description });
  if (input === undefined) { return false; }
  let document = editor.document;
  let documentText = document.getText();
  if (inputVars[0].name !== undefined) {
    let varRegex = getVariableWithParamsRegex('input', 'g');
    let result;
    while ((result = varRegex.exec(documentText)) !== null) {
      if (result.index === inputVars[0].regexMatch.index) { continue; }
      let inputVar = new InputVariableProperties(result);
      if (inputVar.name !== inputVars[0].name) { continue; }
      inputVars.push(inputVar);
    }
  }
  return editor.edit( editBuilder => {
    inputVars.forEach( e => {
      let start = document.positionAt(e.regexMatch.index);
      let varRange = new vscode.Range(start, start.translate(0, e.regexMatch[0].length));
      editBuilder.replace(varRange, e.transform(input));
    });
  });
}

/** @param {vscode.TextEditor} editor */
async function handleSnippetNoUI(editor) {
  let document = editor.document;
  let documentText = document.getText();
  let snippetVarRegEx = getVariableWithParamsRegex('snippet', 'g');
  let result;
  while ((result = snippetVarRegEx.exec(documentText)) !== null) {
    let snippetVar = new SnippetVariableProperties(result);
    if (snippetVar.hasUI) { continue; }
    let start = document.positionAt(snippetVar.regexMatch.index);
    let varRange = new vscode.Range(start, start.translate(0, snippetVar.regexMatch[0].length));
    await editor.insertSnippet(new vscode.SnippetString(snippetVar.snippet), varRange);
    return true;
  }
  return false;
}

function get_fileBasename_NewFilePath(filepath, fileBasenameNoExtension, fileExtname) {
  let fileBasename = fileBasenameNoExtension;
  if ( (fileExtname.length !== 0) && !fileBasenameNoExtension.endsWith(fileExtname)) {
    fileBasename += fileExtname;
  }
  let curDir = filepath;
  if (!pathIsDirectory(filepath)) {
    curDir = path.dirname(filepath);
  }

  let newFilePath = path.join(curDir, fileBasename);
  return [fileBasename, newFilePath];
}

function transformVariable(data, variableValue, variableName) {
  let regex = getVariableWithParamsRegex(variableName, 'g');
  return data.replace(regex, (...regexMatch) => {
    let props = new VariableTransformProperties(regexMatch);
    return props.transform(variableValue);
  });
}

function substDirectoryPart(data, dirname, variableName) {
  let dirnameSplit = dirname.split('/');
  let regex = new RegExp(`\\$\\{${variableName}\\[(-\\d)\\]\\}`, 'g');
  return data.replace(regex, (m, p1) => {
    let idx = dirnameSplit.length + Number(p1);
    if (idx >= 0 && idx < dirnameSplit.length) {
      return dirnameSplit[idx];
    }
    return 'Unknown';
  });
}

/** @param {string} data @param {string} newFilePath  @param {string} fileBasename  @param {string} fileExtname  @returns {string} */
function variableSubstitution(data, newFilePath, fileBasename, fileExtname) {
  let newFileURI = vscode.Uri.file(newFilePath);
  let workspaceURI = vscode.workspace.getWorkspaceFolder(newFileURI).uri; // should always have a result
  let relativeFile = 'Unknown';
  let relativeFileDirname = relativeFile;
  if (lowerCaseDriveLetter(newFileURI.path).indexOf(lowerCaseDriveLetter(workspaceURI.path)) === 0) { relativeFile = newFileURI.path.substring(workspaceURI.path.length+1); }
  let pos = relativeFile.lastIndexOf(fileBasename);
  if (pos !== -1) { relativeFileDirname = relativeFile.substring(0, pos); }
  if (relativeFileDirname.endsWith('/')) { relativeFileDirname = relativeFileDirname.substring(0, relativeFileDirname.length-1); }
  let fileBasenameNoExtension = fileBasename;
  if ( (fileExtname.length !== 0) && fileBasename.endsWith(fileExtname)) {
    fileBasenameNoExtension = fileBasename.substring(0, fileBasename.length - fileExtname.length);
  }

  let config = vscode.workspace.getConfiguration('templates', newFileURI);
  data = data.replace(/\$\{author\}/ig, getAuthor(config));  // config.get('author'));
  data = data.replace(/\$\{date\}/ig, new Date().toDateString());
  data = data.replace(getVariableWithParamsRegex('dateTimeFormat', 'g'), (...regexMatch) => {
    let dateConfig = config.get('dateTimeFormat');
    let props = new DateTimeFormatProperties(regexMatch);
    if (props.name) {
      props.nameConfig = getProperty(dateConfig, props.name, {});
    }
    return dateTimeFormat(props.config, props.nameConfig, dateConfig);
  });
  data = transformVariable(data, fileBasename, 'fileBasename');
  data = transformVariable(data, fileBasenameNoExtension, 'fileBasenameNoExtension');
  data = transformVariable(data, fileExtname, 'fileExtname');
  data = transformVariable(data, relativeFile, 'relativeFile');
  data = transformVariable(data, relativeFileDirname, 'relativeFileDirname');

  data = substDirectoryPart(data, relativeFileDirname, 'relativeFileDirnameSplit');
  data = substDirectoryPart(data, workspaceURI.path, 'workspaceFolderSplit');
  // for historic reasons
  data = data.replace(/\$\{file\}/ig, fileBasename);
  return data;
}

function createFile(filepath, data = '', fileExtname = '') {
  new Promise((resolve, reject) => {
    let filenamePrefix = '##@@##';
    let fileBasenameNoExtension = undefined;
    if (data.startsWith(filenamePrefix)) {
      let pos = data.indexOf('\n');
      if (pos === -1) {
        fileBasenameNoExtension = data;
        data = '';
      } else {
        fileBasenameNoExtension = data.substring(0,pos);
        data = data.substring(pos+1);
      }
      fileBasenameNoExtension = fileBasenameNoExtension.substring(filenamePrefix.length+1).trim();
      let [fileBasename, newFilePath] = get_fileBasename_NewFilePath(filepath, '__dummy__', fileExtname);
      resolve(variableSubstitution(fileBasenameNoExtension, newFilePath, fileBasename, fileExtname));
      return
    }
    resolve(vscode.window.showInputBox({ prompt: 'Enter new file name' + (fileExtname.length !==0 ? ' (without extension)' : '') }));
  })
    .then(fileBasenameNoExtension => {
      if (!fileBasenameNoExtension) { return; }
      let [fileBasename, newFilePath] = get_fileBasename_NewFilePath(filepath, fileBasenameNoExtension, fileExtname);
      if (pathIsFile(newFilePath)) {
        vscode.window.showErrorMessage(`File already exists: ${newFilePath}`);
        return;
      }
      data = variableSubstitution(data, newFilePath, fileBasename, fileExtname)
      let newFileURI = vscode.Uri.file(newFilePath);

      let offsetCursor = -1;
      if (!getVariableWithParamsRegex('(?:input|snippet)').test(data)) {
        offsetCursor = data.indexOf(cursorVar);
        data = data.replace(/\$\{cursor\}/g, '');
      }

      let saveAfterInputVariable = vscode.workspace.getConfiguration('templates', newFileURI).get('saveAfterInputVariableOnFileCreation');
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

            let foundSnippetNoUI = false;
            while (await handleSnippetNoUI(editor)) {
              await vscode.commands.executeCommand('workbench.action.files.save');
              foundSnippetNoUI = true;
            }

            let inputVarRegEx = getVariableWithParamsRegex('input');
            let foundInputVar = false;
            while (true) {
              let found = document.getText().match(inputVarRegEx);
              if (!found) { break; }
              foundSnippetNoUI = false;
              if(! await processInputVariable(editor, found)) { break; }
              if (saveAfterInputVariable) {
                await vscode.commands.executeCommand('workbench.action.files.save');
                foundInputVar = true;
              }
            }
            if (getVariableWithParamsRegex('snippet').test(document.getText())) { return; }
            await gotoCursor(editor, offsetCursor);
            if (foundSnippetNoUI || foundInputVar) {
              await vscode.commands.executeCommand('workbench.action.files.save');
            }
        });
      });
    });
}

/** @param {vscode.TextEditor} editor @param {vscode.TextEditorEdit} edit @param {any[]} args */
function nextSnippet(editor, edit, args) {
  let document = editor.document;
  let found = document.getText().match(getVariableWithParamsRegex('snippet'));
  if (found) {
    let start = document.positionAt(found.index);
    let varRange = new vscode.Range(start, start.translate(0, found[0].length));
    return editor.insertSnippet(new vscode.SnippetString(found[3]), varRange);
  }
  found = document.getText().match(getVariableWithParamsRegex('input'));
  if (found) {
    return processInputVariable(editor, found);
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
                  vscode.window.showErrorMessage(err.toString());
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

/** @returns {[any,any][]} */
const zip = (a, b) => a.map((k, i) => [k, b[i]]);
const flattened = arr => [].concat(...arr);

class SaveAsIterateProperties {
  constructor() {
    this.fileNameParts = [];
    this.fieldTemplates = [];
    this.fieldResults = [];
  }
}

class BaseFieldTemplate {
  constructor(level) {
    this.level = level;
  }
  async iterate(saveAsProperties) {
    saveAsProperties.fieldResults.push(''); // now index this.level is filled
    await this._iterate(saveAsProperties);
    saveAsProperties.fieldResults.pop();
  }
  async _iterate(saveAsProperties) {
    throw new Error('Function not implemented.');
  }
  /** @param {SaveAsIterateProperties} saveAsProperties */
  async nextLevel(str, saveAsProperties) {
    saveAsProperties.fieldResults[this.level] = str;
    await saveAsProperties.fieldTemplates[this.level + 1].iterate(saveAsProperties);
  }
}

function toNumber(obj, deflt=undefined) {
  let value = Number(obj);
  return Number.isNaN(value) ? deflt : value;
}

class NumericFieldTemplate extends BaseFieldTemplate {
  constructor(level, properties) {
    super(level);
    this.from = toNumber(properties.from, 1);
    this.to = toNumber(properties.to, 5);
    this.size = toNumber(properties.size);
    this.base = toNumber(properties.base, 10);
  }
  /** @param {SaveAsIterateProperties} saveAsProperties */
  async _iterate(saveAsProperties) {
    for (let n = this.from; n <= this.to; ++n) {
      let str = n.toString(this.base);
      if (this.size) { str = str.padStart(this.size, '0'); }
      await this.nextLevel(str, saveAsProperties);
    }
  }
}

class SaveTemplate extends BaseFieldTemplate {
  constructor(level, srcFilePath) {
    super(level);
    this.srcFilePath = srcFilePath;
  }
  /** @param {SaveAsIterateProperties} saveAsProperties */
  async _iterate(saveAsProperties) {
    // both arrays are now same length, last fieldResults === ''
    let destFilePath = flattened(zip(saveAsProperties.fileNameParts, saveAsProperties.fieldResults)).join('');
    if (destFilePath === this.srcFilePath) { return; }
    // console.log(`Copy file to: ${destFilePath}`);
    await vscode.workspace.fs.copy(vscode.Uri.file(this.srcFilePath), vscode.Uri.file(destFilePath), {overwrite:false});
  }
}

/** @param {number} level @param {string} templateDesc @returns {BaseFieldTemplate} */
function constructFieldTemplate(level, templateDesc) {
  let properties = {type:'N', from:1, to:5};
  for (const prop of templateDesc.trim().split(/\s*(?:,|$)\s*/)) {
    let parts = prop.split(/\s*=\s*/);
    if (parts.length !== 2) { continue; }
    properties[parts[0]] = parts[1];
  }
  return new NumericFieldTemplate(level, properties);
}

/** @param {vscode.TextEditor} editor */
async function fileSaveAsNTimes(editor, edit, args) {
  if (editor.document.isDirty) {
    vscode.window.showErrorMessage('File is not saved.');
    return;
  }
  let fileName = editor.document.uri.path;
  let lastSep = fileName.lastIndexOf('/');
  if (lastSep === -1) { return; }
  fileName = fileName.substring(lastSep+1);
  let fileDir = editor.document.uri.fsPath;
  fileDir = fileDir.substring(0, fileDir.lastIndexOf(fileName));
  let lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) { lastDot = fileName.length; }
  let template = '{{type=N,size=4,from=1,to=10,base=10}}';
  let fileNameWithTemplates = `${fileName.substring(0,lastDot)}${template}${fileName.substring(lastDot)}`;
  fileNameWithTemplates = await vscode.window.showInputBox({prompt:`Enter file name with field template(s). ${template}`, value:fileNameWithTemplates, ignoreFocusOut:true});
  if (fileNameWithTemplates === undefined) { return; }

  let fieldTemplates = [];
  let fileNameParts = [];
  let lastIndex = 0;
  const fieldRE = new RegExp('\{\{([^}]+)\}\}', 'g');
  let result;
  while ((result = fieldRE.exec(fileNameWithTemplates)) !== null) {
    fileNameParts.push(fileNameWithTemplates.substring(lastIndex, result.index));
    lastIndex = fieldRE.lastIndex;
    fieldTemplates.push(constructFieldTemplate(fieldTemplates.length, result[1]));
  }
  fileNameParts.push(fileNameWithTemplates.substring(lastIndex));
  fieldTemplates.push(new SaveTemplate(fieldTemplates.length, editor.document.uri.fsPath));

  fileNameParts[0] = fileDir + fileNameParts[0];
  if (fieldTemplates.length === 0) {
    vscode.window.showInformationMessage('No field specified.');
    return;
  }
  let saveAsProperties = new SaveAsIterateProperties();
  saveAsProperties.fileNameParts = fileNameParts;
  saveAsProperties.fieldTemplates = fieldTemplates;
  await fieldTemplates[0].iterate(saveAsProperties);
}

function activate(context) {
  context.subscriptions.push(vscode.commands.registerCommand('templates.newTemplateFromFile', newTemplateFromFile));
  context.subscriptions.push(vscode.commands.registerCommand('templates.newTemplate', newTemplate));
  context.subscriptions.push(vscode.commands.registerCommand('templates.editTemplate', editTemplate));
  context.subscriptions.push(vscode.commands.registerCommand('templates.newFileFromTemplate', newFileFromTemplate));
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('templates.nextSnippet', nextSnippet));
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('templates.fileSaveAsNTimes', fileSaveAsNTimes));
}

function deactivate() { }

module.exports = {
  activate,
  deactivate
}
