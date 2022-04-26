# Change Log

## [Unreleased]
### Added

## [1.10.0] 2022-04-26
### Added
- `${dateTimeFormat}` variable has property `offset` to calculate a date in the future or past, `+1M +10h`

## [1.9.0] 2022-04-18
### Added
- Construct Template Filename (`##@@##`) line now supports absolute and relative file paths
- use the same `Date()` object for all the `date` variables used during template instantiation

## [1.8.0] 2022-04-09
### Added
- Construct Template Filename (`##@@##`) line now supports `${input:description:}` variables

## [1.7.0] 2022-03-25
### Added
- define properties in `${dateTimeFormat}` variable

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
