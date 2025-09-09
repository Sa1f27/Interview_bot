$dates = @(
    "2025-09-09 09:15:00",
    "2025-09-10 16:45:00",
    "2025-09-16 10:00:00",
    "2025-09-24 18:30:00",
    "2025-09-27 14:20:00",
    "2025-09-18 11:10:00",
    "2025-10-02 17:00:00",
    "2025-10-03 09:50:00",
    "2025-10-05 15:30:00",
    "2025-10-14 12:00:00",
    "2025-10-21 08:45:00",
    "2025-10-22 14:15:00",
    "2025-10-27 16:40:00"
)

foreach ($d in $dates) {
    # Modify a dummy file (or real file)
    echo "Update on $d" >> timeline.txt

    # Stage and commit with custom author and date
    git add .
    $env:GIT_AUTHOR_DATE = $d
    $env:GIT_COMMITTER_DATE = $d
    git commit -m "Work update on $d"
}
