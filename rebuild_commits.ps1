$dates = @(
    "2024-09-02 10:00:00",
    "2024-09-07 18:30:00",
    "2024-09-12 14:20:00",
    "2024-09-18 11:10:00",
    "2024-09-24 17:00:00"
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
