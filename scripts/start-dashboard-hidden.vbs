Option Explicit

Dim shell, fso, scriptsDir, repoRoot, pythonwPath, command

Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptsDir = fso.GetParentFolderName(WScript.ScriptFullName)
repoRoot = fso.GetParentFolderName(scriptsDir)
pythonwPath = shell.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\Programs\Python\Python313\pythonw.exe"
If Not fso.FileExists(pythonwPath) Then
  pythonwPath = shell.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\Microsoft\WindowsApps\pythonw.exe"
End If

command = """" & pythonwPath & """ """ & repoRoot & "\scripts\start-dashboard-hidden.py"""

shell.Run command, 0, False
