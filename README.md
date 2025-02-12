The extension supports:

* [Create files from defined templates](#file-templates)
* current file [Save As N times](#save-as-n-times)

# File Templates

Create files from defined templates. Templates can be defined at different levels: Extension, User, Workspace and Folder.

Based on the extension [File Templates for VSCode](https://marketplace.visualstudio.com/items?itemName=bam.vscode-file-templates) by Venkatesh Boddu.

This extension can be used as a replacement for **File Templates for VSCode**. It uses the same command names and key bindings.

It fixes a number of problems and adds a few features.

* command `template.newTemplateFromFile` is renamed to `templates.newTemplateFromFile`<br/>Change this if you have a custom key binding.
* no restriction on naming the template
* add a few variables for File Path and Custom Date, User input and Snippets

## Features

* Create new files from defined templates.
* Create new File Templates either from an existing file or a blank file.
* Edit User defined Templates.
* Use [variables](#template-variables) for Author Name, Date, File Path, User input, calling command results and Snippets.
* [Construct the file name](#construct-template-filename) with variables on first line of template
* Insert a template with a key binding

## Known problems

* If you have opened a **Multiroot Workspace** and you have no editor/file open and you select the command **Files: New File from Template** from the Command Palette, or use the a shortcut key, you get a QuickPick selection with the text **Select a folder to choose templates from and to place the file**. If you escape this QuickPick because you want to abort the new file creation you also have to abort the QuickPick selection with the text **Select a template to create from**. The reason is that if you want to create a new file on an absolute path but you want to choose a global template you can escape the folder selection but you want to choose a template.

## Usage

The locations, if needed, for the **User** Templates and **Multiroot Workspace** Templates need to be defined by the user in the [Templates Location](#templates-location) settings.

* If you select an entry in the File Explorer and use the Context menu (Right-click) you will see a menu entry **New File from Template**.<br/>
  If the Explorer entry is a directory the new file will be created in this directory.<br/>
  If the Explorer entry is a file the new file will a sibling.<br/>
  It shows a menu with existing templates. Select the desired template and enter the new file name without extension. The new file will get the same extension as the selected template.
* In the  Context menu (Right-click) of the editor you will see menu entries:
    * **New File from Template** : Create a new file that is a sibling of the current file.
    * **New Template from File** : Use the current active document as a start for a new template.  
      You are asked in which directory you want this template stored and with which name.  
      ![Select Folder for New Template](images/select-folder-new-template.png)  
      _Theme: Light+_
    * **Next Snippet in File** : the [`${snippet}` variables](#template-variables) needs to be evaluated after creation of the file because the editor needs to be put in _Snippet_ mode. This also resolves the `${cursor}` variable as a final snippet.<br/>If there are no `${snippet}` or `${cursor}` variables nothing happens.<br/>Any `${input}` variables still in the file are also processed.
* From the Command Palette you can select:
    * **Files: New File from Template** (`templates.newFileFromTemplate`) - to create a new file from a template
    * **Files: New File Template** (`templates.newTemplate`) - to create a new blank file template.
    * **Files: New Template from File** (`templates.newTemplateFromFile`) - to create a new template from the current active file.
    * **Files: Edit File Template** (`templates.editTemplate`) - to edit a template.  
      ![Select Template to Edit](images/select-template-to-edit.png)  
      _Theme: Light+_
    * **Files: Next Snippet in File** (`templates.nextSnippet`) - to evaluate the next `${snippet}` or `${input}` variable.
* You can define [variables](#template-variables) in the templates for Author Name, Date, File Path, User input and Snippets

If you use snippet variables often it might be handy to define a key binding for the command: `templates.nextSnippet`

## Insert Template in current file

The command `templates.pasteTemplate` allows to insert a template into the current editor. Every selection is replaced with the template. The first variable in the file, in the order `${snippet}`, `${input}`, or `${cursor}` is resolved. If you have more variables left in the inserted template you have to use **Next Snippet in File** command (possibly by keybinding).

The argument of the command is an object with a parameter `text` that is an array of lines that make the template.

An example to insert some dates with offsets in the current file:

**`settings.json`**

```
  "templates.dateTimeFormat": {
    "locale": "en-US",
    "options": {
      "year": "numeric",
      "month": "2-digit",
      "day": "2-digit",
      "hour12": false,
      "hour": "2-digit",
      "minute": "2-digit",
      "second": "2-digit",
      "weekday": "long"
    },
    "template": "${weekday} ${year}-${month}-${day} ${hour}:${minute}:${second}",
    "week-schedule-head": {
      "template": "${month}/${day}"
    },
    "week-schedule": {
      "options": {
        "year": "numeric",
        "month": "short",
        "day": "2-digit",
        "weekday": "long",
      },
      "template": "${weekday} ${month} ${day}, ${year}"
    }
  }
```

**`keybindings.json`**

```
  {
    "key": "ctrl+alt+w",  // or any other combo
    "command": "templates.pasteTemplate",
    "args": {
      "text": [
        "## Week (${dateTimeFormat:week-schedule-head:offset=+1wd0 +1d:}–${dateTimeFormat:week-schedule-head:offset=+1wd0 +5d:})",
        "- [ ]",
        "",
        "### ${dateTimeFormat:week-schedule:offset=+1wd0 +1d:}",
        "- [ ] Snippet",
        "",
        "----"
      ]
    }
  }
```

## Templates Location

The templates can be stored in several locations:

* **Extension** : The extension has a number of predefined templates that can not be edited or add to. After an update of the extension these edits would be gone.
* **User** : in a user defined directory from the setting `templates.folder` in the User settings (a good location is `<homedir>/.vscode/templates`, the installed extensions are stored in a sibling directory) (Optional)
* **Multiroot Workspace** : in a user defined directory from the setting `templates.folder` in the Workspace settings (`.code-workspace` file) (Optional)
* **Workspace/Folder** : When a folder is open the templates are stored in the directory `.vscode/templates`

Each location is more specific of where the template can be used. Templates with the same name override templates on a more generic level. When you need to select a template to create from it shows the location of the template and the more specific ones are listed first

A directory is only created when you store a new template in that directory.

## Construct Template Filename

You can construct the filename to use with **special formatted first line(s)** of the template. The format is

<code>##@@## <em>filePathNoExtension</em></code>

`filePathNoExtension` is the absolute/relative path of the file without the file extension. The text can contain [variables](#template-variables) (not the `snippet` and `cursor`). Only <code>&dollar;{input:<em>description</em>:}</code> is supported with transforms, not the _named_ variant.

All lines, up to the first line **not** starting with `##@@##` are used to construct the Template Filename. Each line is stripped of the prefix and all whitespace at start and end.

Always use `/` as directory separator. Also on Windows.

* **absolute path**
  * <code>##@@## /<em>filePathNoExtension</em></code> (Unix)
  * <code>##@@## <em>driveLetter</em>:/<em>filePathNoExtension</em></code> (Windows)
* **relative path**
  * <code>##@@## ~/<em>filePathNoExtension</em></code> in User Home directory
  * <code>##@@## ~w/<em>filePathNoExtension</em></code> in workspace folder
  * <code>##@@## ~f/<em>filePathNoExtension</em></code> in workspace folder
  * <code>##@@## <em>filePathNoExtension</em></code> relative to current file or selected entry in File Explorer

You can use it to:

* Some frameworks name the file in a certain way based on the directory stored or the class defined in the file.
* Add a date somewhere in the filename
* Use `date` and `input` variables to create part of the directories in the path
* create a template for `.vscode/settings.json`, `.vscode/tasks.json` or `.vscode/launch.json` and specify the path relative to the workspace.

Example 1:

```
##@@## ${relativeFileDirnameSplit[-1]}
```

There is a global snippet defined (all languages) with the prefix `template-file-name` that has this content.

Example 2:

If you have defined a `dateTimeFormat` named `iso` and you want to create file names that start with a date and a possible addition you can use:

```
##@@## ${dateTimeFormat:iso:}${input#Additional#find=^(.+)$#replace=-$1#}
```

* if you cancel the input box no file is created.
* if you enter the empty string you only get the date file name
* if you type some additional text a separator (here `-`) will be added

There is a global snippet defined (all languages) with the prefix `template-file-name-date-input` that has this content.

Example 3:

Save the file in the User Home directory and group the files by year and month in a directory:

```
##@@## ~/blog/${dateTimeFormat#options={"year":"numeric","month":"2-digit","day":"2-digit"}#template=${year}/${month}/${day}#}${input#Subject#find=^(.+)$#replace=-$1#}
```

Or on multiple lines:

```
##@@## ~/blog/${dateTimeFormat#
##@@##          options={"year":"numeric","month":"2-digit","day":"2-digit"}#
##@@##          template=${year}/${month}/${day}#}
##@@##     ${input#Subject#find=^(.+)$#replace=-$1#}
```

## Template variables

In the template you can define a number of variables. They are evaluated at file creation time except for `${snippet}` variables that do not have the property `noUI`.

### Variable properties

Some variables can have properties. This is part of the variable and needs to be specified using separator strings.

<code>&dollar;{<em>variableName</em> <em>separator</em> <em>properties</em> <em>separator</em>}</code>

All _`separator`_'s used in a variable need to be the same.

The _`separator`_ is a string of 1 or more characters that are not part of the a to z alfabet, `$` or `{}`, in regular expression `[^a-zA-Z{}$]+`. Choose a character string that is not used in the  _`properties`_ part. If you need to use more than 1 character be carefull if you use the same character, you can experience unwanted behavior. The reason is that JavaScript regular expression does not have a non-backtrack greedy quantifier. Currently the variable is matched with 1 regular expression. This makes everything easy to implement.

The _`properties`_ part uses the same _`separator`_ string to separate the different properties.

In the description the `:` or `##` is used as the separator, choose a different one if you use this in the variable property.

All variables can span multiple lines to make the properties more readable. All whitespace at the start of a property is removed. Prevent whitespace at the end of a property value by ending a line with the _`separator`_.

The variable must end with <code><em>separator</em>}</code>. That means no whitespace after the last _`separator`_. Also for variables spanning multi lines.

If the property is a <code><em>key</em>=<em>value</em></code> pair the whitespace around `=` is part of the _`key`_ or the _`value`_.

### Variable Transform (Find/Replace)

The variables marked in the description with (**Transform**) can have the value transformed with 1 or more find-replace operations. The transforms are applied in the order given.

Each transform is defined with the following properties:

<code>find=<em>regex</em>:flags=<em>string</em>:replace=<em>string</em></code>

The text is [searched and replaced with a regular expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace). All occurrences of `find` are replaced if `flags` has `g`. The capture groups in the `find` regex can be used in the `replace` string with <code>&dollar;<em>n</em></code> (like `$1`). `flags` are the regex flags used in the search. If `find`, `flags` or `replace` property are not defined they default to `(.*)`, _emptyString_ and `$1` respectively.

You can define as many `[0...)` find-replace transforms as you like.

#### Example

Remove 2 directory names from the `${relativeFileDirname}` :

```
${relativeFileDirname##find=^([^/]+/){2}##replace=##}
```

### Variable Description

A number of variables is identical to the [variables that can be used in `tasks.json` and `launch.json`](https://code.visualstudio.com/docs/editor/variables-reference#_predefined-variables):

* `${relativeFile}` : (**Transform**) the current opened file relative to workspaceFolder
* `${relativeFileDirname}` : (**Transform**) the current opened file's dirname relative to workspaceFolder
* <code>&dollar;{relativeFileDirnameSplit[<em>number</em>]}</code> : _number_ can be `-1...-9`, get part _number_ of the `relativeFileDirname` relative to the end, `-1` is the last part
* <code>&dollar;{workspaceFolderSplit[<em>number</em>]}</code> : _number_ can be `-1...-9`, get part _number_ of the `workspaceFolder` relative to the end, `-1` is the last part
* `${fileBasename}` : (**Transform**) the current opened file's basename
* `${fileBasenameNoExtension}` : (**Transform**) the current opened file's basename with no file extension
* `${fileExtname}` : (**Transform**) the current opened file's extension
* <code>&dollar;{command##command=<em>commandID</em>##args=<em>JSON_object</em>##}</code> : The result of calling the command with the _`commandID`_ and the given (optional) `args` JSON object. The `args` property is passed as is to the command. No variables in the strings are evaluated. The command must know how to handle them. ([example](#variable-command))
* <code>&dollar;{field[<em>number</em>]}</code> : variable is valid in the command [Save As N times](#save-as-n-times) (`templates.fileSaveAsNTimes`), in the file name template we have 1 or more fields. _number_ is the index in the array of fields, _number_ can be positive or negative:  
  * positive numbers start counting from the left, `0` is the first field
  * negative numbers start counting from the right, `-1` is the last field
* <code>&dollar;{expression##expr=<em>JS_expr</em>##size=<em>number</em>##padding=<em>string</em>##base=<em>number</em>##}</code> : If you want to perform a calculation and/or base conversion with a field number you describe the JavaScript expression in the `expr` property.  
  The `size`, `padding`, `base` and `uppercase` properties control the display of the expression result.  
  The following properties are defined:  
  * <code>expr=<em>JS_expression</em></code> : A JavaScript expression that has number or sting result.  
  The expression can contain field references of the form: <code>field[<em>number</em>]</code>  
  For possible values of _number_ see <code>&dollar;{field[<em>number</em>]}</code>  
  These references are replaced with the **string** of the field as used in the filename. You have to convert these strings before you can perform a calculation. Use [`Number.parseInt()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/parseInt) or [`Number()`](https://stackoverflow.com/q/51009465/9938317) with a prefix (if not in base 10).  
  Example: <code>&dollar;{expression##expr=Number.parseInt(field[0], 16)+Number('0x'+field[1])##}</code>
  * <code>size=<em>number</em></code> : (Optional) if `size` is defined, the result is padded with the `padding` string on the left to get a string of the given size (default: undefined)
  * <code>padding=<em>string</em></code> : (Optional) which padding string to use if `size` is defined, (default: _space_ or `0`)
  * <code>base=<em>number</em></code> : (Optional) if result is a number in which base/radix to show the number, allows you to generate numbers with base, 2, 8, 16. Possible values [2, 36] (default: 10)
  * <code>uppercase</code> : (Optional) flag (no value) to use `A-Z` for base > 10

The next variables use settings:

* `${author}` : use the value for setting `templates.author`
* `${date}` : show the current date and time in a fixed format, for historic reasons this variable is still allowed.
* `${dateTimeFormat}` : use the setting `templates.dateTimeFormat` to construct a [date-time](#variable-datetimeformat).
* <code>&dollar;{dateTimeFormat:<em>name</em>:}</code> : use a _named_ format in the setting `templates.dateTimeFormat` to construct a [date-time](#variable-datetimeformat). The named format properties override what is defined in `templates.dateTimeFormat`.
* <code>&dollar;{dateTimeFormat#<em>properties</em>#}</code> : define _`properties`_ to construct a [date-time](#variable-datetimeformat).  
  Best to use a different separator (`#`) because `:` is a character used in JSON strings.  
  Allowed properties are:
    * _`key_only`_ : a property that has no value is equal to _`name=key_only`_
    * <code>name=<em>value</em></code> : use the named format in the setting `templates.dateTimeFormat`
    * <code>locale=<em>value</em></code> : override the _`locale`_ property to use
    * <code>options=<em>JSON-string</em></code> : override the _`options`_ property to use. It must be a valid JSON string: `{.....}`
    * <code>template=<em>value</em></code> : override the _`template`_ property to use
    * <code>offset=<em>delta-DateTime-string</em></code> : a string containing date/time offsets for year, month, day, hour, minute, second, day-of-the-week separated by spaces. They are applied in the order given. The syntax of the offsets is:
      * <code>+<em>number</em><strong>Y</strong></code> or <code>-<em>number</em><strong>Y</strong></code> : set the date _number_ of **Y**ears offset, `y` is also allowed
      * <code>+<em>number</em><strong>M</strong></code> or <code>-<em>number</em><strong>M</strong></code> : set the date _number_ of **M**onths offset
      * <code>+<em>number</em><strong>D</strong></code> or <code>-<em>number</em><strong>D</strong></code> : set the date _number_ of **D**ays offset, `d` is also allowed
      * <code>+<em>number</em><strong>h</strong></code> or <code>-<em>number</em><strong>h</strong></code> : set the date _number_ of **h**ours offset
      * <code>+<em>number</em><strong>m</strong></code> or <code>-<em>number</em><strong>m</strong></code> : set the date _number_ of **m**inutes offset
      * <code>+<em>number</em><strong>s</strong></code> or <code>-<em>number</em><strong>s</strong></code> : set the date _number_ of **s**econds offset
      * <code>+<em>number</em><strong>WD</strong><em>wd_number</em></code> or <code>-<em>number</em><strong>WD</strong><em>wd_number</em></code> : set the date _number_ of **D**ay of the **W**eek offset, `wd` is also allowed  
        the week-day number (<em>wd_number</em>) has a value of `0..6`, with `0` = Sunday, `1` = Monday, ..., `6` = Saterday  
        Example: to get the next Sunday use: `+1WD0`  
        If the week-day number of today equals <em>wd_number</em> it counts as 1.  
        Example: to get next weeks Monday you would use: `+1WD0 +1D`  
        `+1D +1WD0` will end up on a Sunday.  

  The properties _`locale`_, _`options`_, _`template`_, _`offset`_ are searched for in the following order:
    1. the variable format properties
    1. the _named_ format in the setting `templates.dateTimeFormat`, if a `name` is specified.
    1. the `templates.dateTimeFormat` setting

  The first place where it is defined is used.

The next variables can have a GUI element:

* <code>&dollar;{input:<em>description</em>:}</code> : (**Transform**) Ask the user some text and use the _`properties`_ part as the description for the InputBox<br/>Example: `${input:Title of this page:}`
* <code>&dollar;{input:<em>description</em>:name=<em>name</em>:}</code> : (**Transform**) Ask the user some text and use the text in all named `${input}` variables with the same _name_. If no _name_ given only for this variable the text is used.
If the _description_ starts with `name=` that `${input}` variable is considered a named input variable that uses the default _description_ text.
* <code>&dollar;{snippet:<em>definition</em>:}</code> : you can use the full syntax of the [Visual Studio Code snippets](https://code.visualstudio.com/docs/editor/userdefinedsnippets#_snippet-syntax).<br/>A snippet is evaluated after the file is created with the command: **Next Snippet in File** from the Context Menu or Command Palette. The editor needs to be put in _Snippet_ mode. Apply this command for every `${snippet}` or `${cursor}` variable still in the file.<br/>
  Example: `${snippet##${1|*,**,***|} ${TM_FILENAME/(.*)/${1:/upcase}/} ${1}##}`
* <code>&dollar;{snippet:<em>definition</em>:noUI:}</code> : Adding the property `noUI` should only be added to `${snippet}` variables that do not need User Interaction (variable transforms). These snippets are resolved at file creation.
* <code>&dollar;{for-snippet:<em>definition</em>:<em>properties</em>:noUI:}</code> : Loop over a collection of files in the workspace and insert a snippet for each file. At the moment only `noUI` snippets are supported in a for loop. This variable is resolved at file creation. ([example](#variable-for-snippet))  
  Allowed properties are:
  * _definition_ : is the snippet definition used. Must be the first property. It can contain variables.  
    * <code>&dollar;{<em>name</em>}</code> : these variables (with or without properties) relate to the file you are creating.
    * <code>&dollar;\\{<em>name</em>}</code> : these variables (with or without properties) relate to the file iterated by the for loop.  
    The variable <code>&dollar;\\{CLIPBOARD}</code> (a standard snippet variable) contains the value of the <code>&dollar;{relativeFile}</code> variable but it allows you to transform the content like other snippet variables
  * <code>files=<em>glob</em></code> : using [`vscode.workspace.findfiles`](https://code.visualstudio.com/api/references/vscode-api#workspace.findFiles) this is the `include` glob pattern. You can use variables to construct the glob pattern.
  * <code>exclude=<em>glob</em></code> : (optional) using [`vscode.workspace.findfiles`](https://code.visualstudio.com/api/references/vscode-api#workspace.findFiles) this is the `exclude` glob pattern. You can use variables to construct the glob pattern. See the doc for the special values `undefined` and `null`.
  * `newline` : (optional) do we have to add a newline character after each snippet.
  * `noUI` : only No User Interaction snippets are allowed

For template instantiation the `${input}` variables are processed at file creation. If you have some file with `${input}` variables they are also processed with the **Next Snippet in File** command. This can happen if you escape an `${input}` variable. This way you can later process them.

A final empty variable to place the cursor:

* `${cursor}` : If you want the cursor to end in a specific location after the file is created or as a last snippet use this variable

## Literal `${...}` in result

When you have a template for a `tasks.json` or `launch.json` you may want to have variables in the result when you create a file from a template. Variables like `${relativeFile}` that are replaced when you create the file. This can be done by wrting `$\{relativeFile}` in the template.

When the file is created variables are searched with the regular expression <code>\\&dollar;\\{<em>name</em>.*?\\}</code>.  
This will not match `$\{relativeFile}`.  
At the end the string `$\{` is replaced with `${` using the regular expression `\$\\\{`.

## Variable dateTimeFormat

This variable `${dateTimeFormat}` uses the setting `templates.dateTimeFormat`. It can use the unnamed format properties or you can use <em>name</em>d format properties: <code>&dollar;{dateTimeFormat:<em>name</em>:}</code> (example uses separator `:`)

Another possibility is <code>&dollar;{dateTimeFormat#<em>properties</em>#}</code> to (optionally) name a format and override some of its properties in the [variable properties](#variable_properties). Or define all 3 properties in the variable properties. See Example 4.

The setting `templates.dateTimeFormat` is an object with properties that are used to call [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat) to create a language-sensitive format of the current date and time.

The `locale` and `options` properties are the arguments for the [`Intl.DateTimeFormat` constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat/DateTimeFormat) and are optional.

The `locale` property can be a single string or an array of strings of language tags. If not specified the browser default locale is used.

The `template` property is an optional template string that uses the same placeholder syntax as the [Javascript template strings](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals). You can add as many literal text as needed.

The only expressions valid are the `type` values returned by the [`Intl.DateTimeFormat.prototype.formatToParts()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat/formatToParts) method. See example 1.

If there is no `template` property the value parts of the `Intl.DateTimeFormat.prototype.formatToParts()` are joined. See example 2.

### Named DateTime Formats

Any other property of `templates.dateTimeFormat` is a <em>name</em>d DateTimeFormat object that can define the properties `locale`, `options` and `template`. These properties override the values defined in `templates.dateTimeFormat`. See Example 3.

### Example 1

**`settings.json`**

```json
    "templates.dateTimeFormat": {
      "locale": "en-US",
      "options": {
        "year": "numeric",
        "month": "2-digit",
        "day": "2-digit",
        "hour12": false,
        "hour": "2-digit",
        "minute": "2-digit",
        "second": "2-digit"
      },
      "template": "${year}/${month}/${day}-${hour}:${minute}:${second}"
    }
```

The result is

```
2020/03/19-18:01:18
```

### Example 2

You can use a different locale and number system and use the long format:

**`settings.json`**

```json
    "templates.dateTimeFormat": {
      "locale": "fr-FR-u-nu-deva",
      "options": {
        "dateStyle": "full",
        "timeStyle": "full"
      }
    }
```

The result is

```
jeudi १९ mars २०२० à १७:५९:५७ heure normale d’Europe centrale
```

### Example 3 Named DateTime Formats

**`settings.json`**

```json
    "templates.dateTimeFormat": {
      "locale": "en-US",
      "options": {
        "year": "numeric",
        "month": "2-digit",
        "day": "2-digit",
        "hour12": false,
        "hour": "2-digit",
        "minute": "2-digit",
        "second": "2-digit"
      },
      "template": "${year}/${month}/${day}-${hour}:${minute}:${second}",
      "year-only": { "template": "${year}" },
      "timeHMS": { "template": "${hour}:${minute}:${second}" },
      "long": {
        "options": {
          "year": "numeric",
          "month": "long",
          "day": "numeric",
          "weekday": "long",
          "hour12": false,
          "hour": "2-digit",
          "minute": "2-digit",
          "second": "2-digit"
        },
        "template": "${weekday} ${month} ${day} ${year}"
      }
    }
```

In the template use these variables (example uses `:` as separator):

```
${dateTimeFormat}
${dateTimeFormat:year-only:}
${dateTimeFormat:timeHMS:}
${dateTimeFormat:long:}
```

### Example 4 DateTime Format properties in the variable

You can specify any of the properties _`locale`_, _`options`_, _`template`_ in the variable and a possible _`name`_.

Using the **`settings.json`** from Example 3 we can use the following variables in the template:

```
${dateTimeFormat#
    template=${year}/${month}/${day} at ${hour}:42#}

${dateTimeFormat#long#
    template=${hour}:${minute} on ${weekday} ${month} ${day} ${year}#}

${dateTimeFormat#name=long#
    template=Let's join at ${hour}:00 one day in ${month} ${year}#
    options={
          "year": "numeric",
          "month": "long",
          "day": "numeric",
          "weekday": "long",
          "hour12": false,
          "hour": "2-digit",
          "minute": "2-digit",
          "second": "2-digit",
          "numberingSystem": "thai"
        }
    #}
```

### Example 5 Create a week schedule

If you need a template to create a week schedule for next week, starting at Monday, you can use the following date variables (we use some date time properties named `week-schedule`):

```
${dateTimeFormat:week-schedule:offset=+1WD0 +1D:}   # Monday
${dateTimeFormat:week-schedule:offset=+1WD0 +2D:}   # Tuesday
${dateTimeFormat:week-schedule:offset=+1WD0 +3D:}   # Wednesday
${dateTimeFormat:week-schedule:offset=+1WD0 +4D:}   # Thursday
${dateTimeFormat:week-schedule:offset=+1WD0 +5D:}   # Friday
```

You can add any other property you like.

## Variable command

The variable `${command}` calls a commandID with an optional argument and replaces the variable with the result.

In the example we use a property defined in a JSON file that is in the same directory as where the template is placed.

It uses the extension [Command Variable](https://marketplace.visualstudio.com/items?itemName=rioj7.command-variable) to read a JSON property.

The JSON file **`component.json`** stored in the folder is:

```json
{
  "component": {
    "name": "MyCoolServer"
  }
}
```

The template or the command `templates.pasteTemplate` can read the content of the file:

```none
/*---------------------------------
 *  COMPONENT   : ${command##
                    command=extension.commandvariable.file.content##
                    args={ "fileName": "${fileDirname}/component.json",
                           "json": "content.component.name"}##}
 *  UNIT        : ${fileBasename}
 ---------------------------------*/
```

The result could be:

```none
/*---------------------------------
 *  COMPONENT   : MyCoolServer
 *  UNIT        : contact.c
 ---------------------------------*/
```

The `json` property of the `extension.commandvariable.file.content` is a JavaScript expression. You could perform a number calculation or string manipulation (concatenation, split, join, map, ...) with the values extracted from the JSON file.

## Variable for-snippet

If you want to add a number of existing files to the template you can use the <code>&dollar;{for-snippet:<em>definition</em>:<em>properties</em>:}</code> variable.

If you have the following dart project structure:

```none
Project
├── ...
└── lib/
     ├── routes
     ├── services
     ├── ...
     ├── ui/
     │   ├── pages/
     │   │   ├── page_1.dart
     │   │   ├── page_2.dart
     │   │   ├── ...
     │   │   └── pages.dart
     │   └── ...
     ├── ...
     └── main.dart
```

and you want to create the file `page.dart` that contains exports to the files in the `ui/pages` folder to make import easier you can use the the following variable in the template or a key binding:

```none
${for-snippet##export 'package:<project>$\{CLIPBOARD/.*?(\/ui\/.*)$/$1/}';##
  files=${relativeFileDirname}/*.dart##
  exclude=${relativeFile}##
  noUI##
  newline##}
```

Be aware to escape the directory separator `/` inside a regular expression, because `/` is also the regular expression separator.

The result of the <code>&dollar;{for-snippet}</code> variable is:

```dart
export 'package:<project>/ui/pages/page_1.dart';
export 'package:<project>/ui/pages/page_2.dart';
export 'package:<project>/ui/pages/page_3.dart';
```

## Extension Settings

This extension has the following settings that can be defined in [`settings.json`](https://code.visualstudio.com/docs/getstarted/settings) :

* `templates.author` : Set the Author name.
* `templates.Author` : Set the Author name. **Deprecated**: Please use `templates.author` instead.
* `templates.folder` : Define a File system path for a directory to save the templates at this level. Can only be defined at User and Multiroot Workspace level.
* `templates.dateTimeFormat` : An object describing the properties used by the [`${dateTimeFormat}` variable](#variable-datetimeformat)
* `templates.saveAfterInputVariableOnFileCreation` : Save the file after processing ${input} variables when the file is created.

## Key Bindings

The extension defines a few key bindings:

* Create a New File from template

    * Windows:  <kbd>Ctrl</kbd>+<kbd>N</kbd>
    * MAC: <kbd>Cmd</kbd>+<kbd>N</kbd>

* New Untitled file (Visual Studio Code command: `workbench.action.files.newUntitledFile`)

    * Windows:  <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>N</kbd>
    * MAC: <kbd>Cmd</kbd>+<kbd>Alt</kbd>+<kbd>N</kbd>

### User defined key binding

If you create a key binding for the command `templates.newFileFromTemplate` you can pass an `args` property.

The `args` object can contain the properties:

* `templateName` : (Optional) [`string`] the first item from the quickpick list with the same name is choosen.
* `fileExists` : (Optional) [`string`] the action if file already exists. (default: `error`)  
  possible values:
  * `open` : open the file
  * `error` : show error message
  * `silent` : do nothing

You can use the same key combo to select different templates for different workspaces by using:  
`"resourceDirname =~ /^\\/users\\/mememe\\/projectAAA/"`  
in the `when` property. We need to use `\\/` because we escape the `/` in the regex and inside JSON we escape the `\`.

```json
  {
    "key": "alt+m",
    "command": "templates.newFileFromTemplate",
    "args": {
      "templateName": "myCustomizedTemplate.html",
      "fileExists": "silent"
    }
  }
```

# Save As N Times

If you need a series of files with filenames that have a sequence numbering and start all with the same content you can use the command "**Files: Save As N Times**" (`templates.fileSaveAsNTimes`). This command can also be found in the context menu of the editor.

The command asks to enter a file name template with fields. A field is a series of properties enclosed by `{{ }}`. The properties are comma separated _`key=value`_ pairs. The type of the field is determined by the property _`type`_. Based on the current file name a suggestion is shown in the input box with 1 field added just before the file extension.

A file name template has 1 or multiple fields. If no field is found a message is shown and no new file is created.

At the moment only a numeric field (`type=N`) is possible.

If a property has a numeric value this can be entered with prefix `0b` and `0x` for respective base 2 and 16.

The other properties are:

* Numeric field (`type=N`)

    * <code>from=<em>number</em></code> : the starting number of this field (default: 1)
    * <code>to=<em>number</em></code> : the last number of this field (default: 5)
    * <code>size=<em>number</em></code> : if `size` is defined, the number is padded with `0`'s on the left to get a string of the given size (default: undefined)
    * <code>base=<em>number</em></code> : the base of the number of this field, allows you to generate numbers with base, 2, 8, 16. Possible values [2, 36] (default: 10)

    If `from > to` no files will be created.

    Using negative values for `from` and `to` give unexpected results, the `-` sign is not the start character of the resulting string of the field.

The file content can have [variables](#template-variables). Use the <code>&dollar;{field[<em>number</em>]}</code> variable to get the result of the file name template fields. Use the <code>&dollar;{expression##expr=<em>JS_expr</em>##}</code> variable if you want to perform a calculation with the <code>field[<em>number</em>]</code> string values.  
The `${input}` and `${snippet}` variables need an editor, they can be resolved when you open the file and use the command **Files: Next Snippet in File**.

The files are saved in the same folder as the current file. No file will be overwritten. If the files need to be replaced you have to delete them first.

## Example with multiple fields

The following file name template:

```
page-{{type=N,size=2,from=1,to=3}}-{{type=N,size=3,from=1,to=5}}.html
```

generates the following files:

```
page-01-001.html
page-01-002.html
page-01-003.html
page-01-004.html
page-01-005.html
page-02-001.html
page-02-002.html
page-02-003.html
page-02-004.html
page-02-005.html
page-03-001.html
page-03-002.html
page-03-003.html
page-03-004.html
page-03-005.html
```

## TODO

* support multiple `${cursor}` variables. To get a Multi Cursor after creating a file from a template
