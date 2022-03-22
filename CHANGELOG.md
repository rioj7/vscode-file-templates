# Change Log

## [Unreleased]
### Added

## [1.6.0] 2022-02-23
### Added
- transform (find/replace) file variables

## [1.5.0] 2022-02-20
### Added
- construct filename in template with initial line starting with `##@@##` and containing variables
- variables `${relativeFileDirnameSplit[-1]}` and `${workspaceFolderSplit[-1]}`, `-1` .. `-9`, part of the directory relative to end
- global snippet `template-file-name` to start constructing a filename for the new file
- CHANGELOG.md

### Modified
- global template `file-variables.txt` to contain new variables

## [1.4.0] 2021-12-15
### Added
- `noUI` property of `${snippet}` variable

## [1.3.0] 2022-12-15
### Added
- named input variable `${input:Enter the title:name=title:}`, reuse entered text in input variables with same name
- find/replace text from input variable
- setting: `templates.saveAfterInputVariableOnFileCreation`

## [1.2.0] 2022-09-16
### Added
- Save As N Times

## [1.1.1] 2021-08-16
### Added
- do not add a double extension

## [1.1.0] 2021-06-22
### Added
- named dateTimeFormats

## [1.0.0] 2021-02-28
- Initial release
