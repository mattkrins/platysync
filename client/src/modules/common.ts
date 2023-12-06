/**
    Check if string is valid for the windows filesystem.
    @param value - Any string
    @returns true|false
*/
export function validWindowsFilename(value: string): boolean {
  const invalidChars = /[<>:"/\\|?*]/g;
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
  return !invalidChars.test(value) && !reservedNames.test(value) && value.length <= 260 && value.length > 0;
}
