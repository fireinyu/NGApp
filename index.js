if (localStorage.accNo){
    location.replace('dashboard.html')
}else if (localStorage.apiKey){
    location.replace('accounts.html')
}else{
    location.replace('login.html')
}