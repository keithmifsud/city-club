

// old code ... @todo remove ...


    console.log('Keith test');


/*
curl -X "POST" "https://eu1-stable-api.mryum.com/graphql" \-H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzNTY5YmFhZi0wNzk1LTRjMGUtYWRhMy0wZjVjYzA1YTBmNjYiLCJzdWIiOiIxMDM5ODRjZi0wZmM2LTQwMTMtYWMxMC03MmViMDdkZDM0YjYiLCJpYXQiOjE2NDY4NjMyMzEsImlzcyI6Imh0dHBzOi8vZXUxLXByb2R1Y3Rpb24tc3RhYmxlLWFwaS5tcnl1bS5jb20iLCJhdWQiOiJodHRwczovL2V1MS1wcm9kdWN0aW9uLXN0YWJsZS1hcGkubXJ5dW0uY29tIiwiZXhwIjoxNjc4Mzk5MjMxfQ.MDTXIszIVWhmbPmplmoRQ6Mv8gMBxk34KRt3vKFfZl0' \-H 'Content-Type: application/json; charset=utf-8' \-d $'{ "query": "query{guestMembership(guestId: \\"R3Vlc3Q6ZWJmNDE1YmYtMjQ2My00NTQwLWJjMzctMDE5NjYxYWI5YWY2\\") {points name tier email mobile}}",  "variables": {}}'