$JUNIOR_FIRST_NAMES = "Luca", "Noah", "Arlo", "Mika", "Toby", "Evan", "Rory", "Jude", "Finn", "Kai"
$JUNIOR_LAST_NAMES = "Mercer", "Sloan", "Hale", "Bennett", "Cross", "Mori", "Dawes", "Pryce", "Vale", "Keane"
$seenNames = New-Object System.Collections.Generic.HashSet[string]
Get-Content "current_players.txt" | ForEach-Object { [void]$seenNames.Add($_.Trim()) }
$playerName = "Elliot Vance"
$seasonStartYear = 2049
$additions = New-Object System.Collections.Generic.List[string]

for ($index = 0; $index -lt 8; $index++) {
    $attempt = 0
    $fullName = ""
    do {
        $seed = $seasonStartYear * 17 + $index * 11 + $attempt * 23
        $suffix = ""
        if ($attempt -gt 0) {
            $charIndex = 65 + (($seasonStartYear + $index + $attempt) % 26)
            $suffix = " " + [char]$charIndex
        }
        $firstName = $JUNIOR_FIRST_NAMES[$seed % $JUNIOR_FIRST_NAMES.Count]
        $lastName = $JUNIOR_LAST_NAMES[($seed * 3) % $JUNIOR_LAST_NAMES.Count]
        $fullName = "$firstName $lastName$suffix"
        $attempt++
    } while (($seenNames.Contains($fullName) -or $fullName -eq $playerName) -and $attempt -lt 40)

    if (-not $fullName -or $seenNames.Contains($fullName) -or $fullName -eq $playerName) {
        continue
    }

    [void]$seenNames.Add($fullName)
    $additions.Add($fullName)
}

Write-Host "Additions count: $($additions.Count)"
$additions | ForEach-Object { Write-Host $_ }
