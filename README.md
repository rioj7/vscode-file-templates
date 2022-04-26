The extension supports:

* [Create files from defined templates](#file-templates)
* [Save As current file N times](#save-as-n-times)

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
* Use [variables](#template-variables) for Author Name, Date, File Path, User input and Snippets.
* [Construct the file name](#construct-template-filename) with variables on first line of template

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

## Templates Location

The templates can be stored in several locations:

* **Extension** : The extension has a number of predefined templates that can not be edited or add to. After an update of the extension these edits would be gone.
* **User** : in a user defined directory from the setting `templates.folder` in the User settings (a good location is `<homedir>/.vscode/templates`, the installed extensions are stored in a sibling directory) (Optional)
* **Multiroot Workspace** : in a user defined directory from the setting `templates.folder` in the Workspace settings (`.code-workspace` file) (Optional)
* **Workspace/Folder** : When a folder is open the templates are stored in the directory `.vscode/templates`

Each location is more specific of where the template can be used. Templates with the same name override templates on a more generic level. When you need to select a template to create from it shows the location of the template and the more specific ones are listed first

A directory is only created when you store a new template in that directory.

## Construct Template Filename

You can construct the filename to use with a **special formatted first line** of the template. The format is

<code>##@@## <em>filePathNoExtension</em></code>

`filePathNoExtension` is the absolute/relative path of the file without the file extension. The text can contain [variables](#template-variables) (not the `snippet` and `cursor`). Only <code>${input:<em>description</em>:}</code> is supported with transforms, not the _named_ variant.

Always use `/` as directory separator. Also on Windows.

* **absolute path**
  * <code>##@@## /<em>filePathNoExtension</em></code> (Unix)
  * <code>##@@## <em>driveLetter</em>:/<em>filePathNoExtension</em></code> (Windows)
* **relative path**
  * <code>##@@## ~/<em>filePathNoExtension</em></code> in User Home directory
  * <code>##@@## ~w/<em>filePathNoExtension</em></code> in workspace folder
  * <code>##@@## ~f/<em>filePathNoExtension</em></code> in workspace folder
  * <code>##@@## <em>filePathNoExtension</em></code> relative to current file or selected entry in File Explorer

If you use a `${dateTimeFormat}` variable with properties it has to be on one line.

You can use it to:

* Some frameworks name the file in a certain way based on the directory stored or the class defined in the file.
* Add a date somewhere in the filename
* Use `date` and `input` variables to create part of the directories in the path

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

## Template variables

In the template you can define a number of variables. They are evaluated at file creation time except for `${snippet}` variables that do not have the property `noUI`.

### Variable properties

Some variables can have properties. This is part of the variable and needs to be specified using separator strings.

<code>${<em>variableName</em> <em>separator</em> <em>properties</em> <em>separator</em>}</code>

All _`separator`_'s used in a variable need to be the same.

The _`separator`_ is a string of 1 or more characters that are not part of the a to z alfabet, `$` or `{}`, in regular expression `[^a-zA-Z{}$]+`. Choose a character string that is not used in the  _`properties`_ part. If you need to use more than 1 character be carefull if you use the same character, you can experience unwanted behavior. The reason is that JavaScript regular expression does not have a non-backtrack greedy quantifier. Currently the variable is matched with 1 regular expression. This makes everything easy to implement.

The _`properties`_ part uses the same _`separator`_ string to separate the different properties.

In the description the `:` is used as the separator, choose a different one if you use this character in the variable property.

All variables can span multiple lines to make the properties more readable. All whitespace at the start of a property is removed. Prevent whitespace at the end of a property value by ending a line with the _`separator`_.

If the property is a <code><em>key</em>=<em>value</em></code> pair the whitespace around `=` is part of the _`key`_ or the _`value`_.

### Variable Transform (Find/Replace)

The variables marked in the description with (**Transform**) can have the value transformed with 1 or more find-replace operations. The transforms are applied in the order given.

Each transform is defined with the following properties:

<code>find=<em>regex</em>:flags=<em>string</em>:replace=<em>string</em></code>

The text is [searched and replaced with a regular expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace). All occurrences of `find` are replaced if `flags` has `g`. The capture groups in the `find` regex can be used in the `replace` string with <code>$<em>n</em></code> (like `$1`). `flags` are the regex flags used in the search. If `find`, `flags` or `replace` property are not defined they default to `(.*)`, _emptyString_ and `$1` respectively.

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
* <code>${relativeFileDirnameSplit[<em>number</em>]}</code> - _number_ can be `-1...-9`, get part _number_ of the `relativeFileDirname` relative to the end, `-1` is the last part
* <code>${workspaceFolderSplit[<em>number</em>]}</code> - _number_ can be `-1...-9`, get part _number_ of the `workspaceFolder` relative to the end, `-1` is the last part
* `${fileBasename}` : (**Transform**) the current opened file's basename
* `${fileBasenameNoExtension}` : (**Transform**) the current opened file's basename with no file extension
* `${fileExtname}` : (**Transform**) the current opened file's extension

The next variables use settings:

* `${author}` : use the value for setting `templates.author`
* `${date}` : show the current date and time in a fixed format, for historic reasons this variable is still allowed.
* `${dateTimeFormat}` : use the setting `templates.dateTimeFormat` to construct a [date-time](#variable-datetimeformat).
* <code>${dateTimeFormat:<em>name</em>:}</code> : use a _named_ format in the setting `templates.dateTimeFormat` to construct a [date-time](#variable-datetimeformat). The named format properties override what is defined in `templates.dateTimeFormat`.
* <code>${dateTimeFormat#<em>properties</em>#}</code> : define _`properties`_ to construct a [date-time](#variable-datetimeformat).  
  Best to use a different separator (`#`) because `:` is a character used in JSON strings.  
  Allowed properties are:
    * _`key_only`_ : a property that has no value is equal to _`name=key_only`_
    * <code>name=<em>value</em></code> : use the named format in the setting `templates.dateTimeFormat`
    * <code>locale=<em>value</em></code> : override the _`locale`_ property to use
    * <code>options=<em>JSON-string</em></code> : override the _`options`_ property to use. It must be a valid JSON string: `{.....}`
    * <code>template=<em>value</em></code> : override the _`template`_ property to use
    * <code>offset=<em>delta-DateTime-string</em></code> : a string containing date/time offsets for year, month, day, hour, minute, second, day-of-the-week separated by spaces. They are applied in the order given. The syntax of the offsets is:
      * <code>+<em>number</em><strong>Y</strong></code> or <code>-<em>number</em><strong>Y</strong></code> : set the date _number_ of **Y**ears offset
      * <code>+<em>number</em><strong>M</strong></code> or <code>-<em>number</em><strong>M</strong></code> : set the date _number_ of **M**onths offset
      * <code>+<em>number</em><strong>D</strong></code> or <code>-<em>number</em><strong>D</strong></code> : set the date _number_ of **D**ays offset
      * <code>+<em>number</em><strong>h</strong></code> or <code>-<em>number</em><strong>h</strong></code> : set the date _number_ of **h**ours offset
      * <code>+<em>number</em><strong>m</strong></code> or <code>-<em>number</em><strong>m</strong></code> : set the date _number_ of **m**inutes offset
      * <code>+<em>number</em><strong>s</strong></code> or <code>-<em>number</em><strong>s</strong></code> : set the date _number_ of **s**econds offset
      * <code>+<em>number</em><strong>WD</strong><em>wd_number</em></code> or <code>-<em>number</em><strong>WD</strong><em>wd_number</em></code> : set the date _number_ of **D**ay of the **W**eek offset  
        the week-day number (<em>wd_number</em>) has a value of `0..6`, with `0` = Sunday, `1` = Monday, ..., `6` = Saterday  
        Example: to get the next Sunday use: `+1WD0`  
        If the week-day number of today equals <em>wd_number</em> it counts as 1.  
        Example: to get next weeks Monday you would use: `+1WD0 +1D`  
        `+1D +1WD0` will end up on a Sunday.  
        If you want to jump a large number of weeks, say Monday 101 weeks ago, it is best to implement 1 jump with `-1WD1` and the rest of the weeks with a day jump `-700D` to get the complete offset: `-1WD1 -700D`. This is 700 times faster to calculate.

  The properties _`locale`_, _`options`_, _`template`_, _`offset`_ are searched for in the following order:
    1. the variable format properties
    1. the _named_ format in the setting `templates.dateTimeFormat`, if a `name` is specified.
    1. the `templates.dateTimeFormat` setting

  The first place where it is defined is used.

The next variables can have a GUI element:

* <code>${input:<em>description</em>:}</code> : (**Transform**) Ask the user some text and use the _`properties`_ part as the description for the InputBox<br/>Example: `${input:Title of this page:}`
* <code>${input:<em>description</em>:name=<em>name</em>:}</code> : (**Transform**) Ask the user some text and use the text in all named `${input}` variables with the same _name_. If no _name_ given only for this variable the text is used.
If the _description_ starts with `name=` that `${input}` variable is considered a named input variable that uses the default _description_ text.
* <code>${snippet:<em>definition</em>:}</code> : you can use the full syntax of the [Visual Studio Code snippets](https://code.visualstudio.com/docs/editor/userdefinedsnippets#_snippet-syntax).<br/>A snippet is evaluated after the file is created with the command: **Next Snippet in File** from the Context Menu or Command Palette. The editor needs to be put in _Snippet_ mode. Apply this command for every `${snippet}` or `${cursor}` variable still in the file.<br/>
  Example: `${snippet##${1|*,**,***|} ${TM_FILENAME/(.*)/${1:/upcase}/} ${1}##}`
* <code>${snippet:<em>definition</em>:noUI:}</code> : Adding the property `noUI` should only be added to `${snippet}` variables that do not need User Interaction (variable transforms). These snippets are resolved at file creation.

For template instantiation the `${input}` variables are processed at file creation. If you have some file with `${input}` variables they are also processed with the **Next Snippet in File** command. This can happen if you escape an `${input}` variable. This way you can later process them.

A final empty variable to place the cursor:

* `${cursor}` : If you want the cursor to end in a specific location after the file is created or as a last snippet use this variable

## Variable dateTimeFormat

This variable `${dateTimeFormat}` uses the setting `templates.dateTimeFormat`. It can use the unnamed format properties or you can use <em>name</em>d format properties: <code>${dateTimeFormat:<em>name</em>:}</code> (example uses separator `:`)

Another possibility is <code>${dateTimeFormat#<em>properties</em>#}</code> to (optionally) name a format and override some of its properties in the [variable properties](#variable_properties). Or define all 3 properties in the variable properties. See Example 4.

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

## Extension Settings

This extension has the following settings that can be defined in [`settings.json`](https://code.visualstudio.com/docs/getstarted/settings) :

* `templates.author` : Set the Author name.
* `templates.Author` : Set the Author name. **Deprecated**: Please use `templates.author` instead.
* `templates.folder` : Define a File system path for a directory to save the templates at this level. Can only be defined at User and Multiroot Workspace level.
* `templates.dateTimeFormat` : An object describing the properties used by the [`${dateTimeFormat}` variable](#variable-datetimeformat)
* `templates.saveAfterInputVariableOnFileCreation` : Save the file after processing ${input} variables when the file is created.

## KeyBindings

* Create a New File from template

    * Windows:  <kbd>Ctrl</kbd>+<kbd>N</kbd>
    * MAC: <kbd>Cmd</kbd>+<kbd>N</kbd>

* New Untitled file (Visual Studio Code command: `workbench.action.files.newUntitledFile`)

    * Windows:  <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>N</kbd>
    * MAC: <kbd>Cmd</kbd>+<kbd>Alt</kbd>+<kbd>N</kbd>

# Save As N Times

If you need a series of files with filenames that have a sequence numbering and start all with the same content you can use the command "**Files: Save As N Times**" (`templates.fileSaveAsNTimes`). This command can also be found in the context menu of the editor.

The command asks to enter a file name template with fields. A field is a series of properties enclosed by `{{ }}`. The properties are comma separated _`key=value`_ pairs. The type of the field is determined by the property _`type`_. Based on the current file name a suggestion is shown in the input box with 1 field added just before the file extension.

A file name template can have 1 or multiple fields. If no field is found a message is shown and no new file is created.

At the moment only a numeric field (`type=N`) is possible.

If a property has a numeric value this can be entered with prefix `0b` and `0x` for respective base 2 and 16.

The other properties are:

* Numeric field (`type=N`)

    * <code>from=<em>number</em></code> : the starting number of this field (default: 1)
    * <code>to=<em>number</em></code> : the last number of this field (default: 5)
    * <code>size=<em>number</em></code> : if `size` is defined, the number is padded with `0`'s on the left to get a string of the given size (default: undefined)
    * <code>base=<em>number</em></code> : the base of the number of this field, allows you to generate numbers with base, 2, 8, 16. Possible values [2, 36] (default: 10)

    If `from >= to` no files will be created.

    Using negative values for `from` and `to` give unexpected results, the `-` sign is not the start character of the resulting string of the field.

The file copies are saved in the same folder as the current file. No file will be overwritten. If the files need to be replaced you have to delete them first.

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
