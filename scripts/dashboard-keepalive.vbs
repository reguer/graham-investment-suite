Option Explicit

Dim shell, fso, scriptsDir, repoRoot, stopFlag

Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptsDir = fso.GetParentFolderName(WScript.ScriptFullName)
repoRoot = fso.GetParentFolderName(scriptsDir)
stopFlag = repoRoot & "\.local_runtime\dashboard-keepalive.stop"

Function DashboardAlive()
  Dim http
  On Error Resume Next
  Set http = CreateObject("MSXML2.XMLHTTP")
  http.open "GET", "http://127.0.0.1:5173/", False
  http.send
  DashboardAlive = (Err.Number = 0 And http.Status = 200)
  Err.Clear
  On Error GoTo 0
End Function

Sub StartDashboard()
  shell.Run "wscript.exe //B //NoLogo """ & repoRoot & "\scripts\start-dashboard-hidden.vbs""", 0, False
End Sub

Do
  If fso.FileExists(stopFlag) Then
    On Error Resume Next
    fso.DeleteFile stopFlag, True
    On Error GoTo 0
    WScript.Quit 0
  End If

  If Not DashboardAlive() Then
    StartDashboard
    WScript.Sleep 8000
  End If

  WScript.Sleep 10000
Loop
