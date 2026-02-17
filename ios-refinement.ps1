$files = Get-ChildItem "c:\Users\Manas\OneDrive\Desktop\aaaaaaaa\AaRa\src\pages\*.tsx", "c:\Users\Manas\OneDrive\Desktop\aaaaaaaa\AaRa\src\components\*.tsx"

foreach ($file in $files) {
    $c = [System.IO.File]::ReadAllText($file.FullName)
    $o = $c

    # Replace rounded-xl with rounded-2xl for that iOS feel
    $c = $c.Replace('rounded-xl', 'rounded-2xl')
    
    # Increase font weights for titles slightly
    $c = $c.Replace('font-bold tracking-tight text-foreground', 'font-semibold tracking-tight text-foreground')
    $c = $c.Replace('font-bold text-lg', 'font-semibold text-lg')
    
    # Ensure all white card backgrounds are explicitly using the 'bg-card' semantic token
    # (The global script usually handles this, but let's be safe)
    $c = $c.Replace('bg-white', 'bg-card')

    if ($c -ne $o) {
        [System.IO.File]::WriteAllText($file.FullName, $c)
        Write-Host "Updated: $($file.Name)"
    }
}

Write-Host "Done!"
