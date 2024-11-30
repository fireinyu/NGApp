
const apiKey = localStorage.getItem('apiKey')
const accounts = JSON.parse(localStorage.getItem('accounts'))

document.addEventListener("DOMContentLoaded",(e)=>{
//DOMContentLoaded block start
document.querySelector('#logout').onclick = (e) =>{
    localStorage.clear();
    location.replace('login.html');
}
let accDiv = document.querySelector("#accounts")
for (let account of accounts){
    account.tags.push('v20')
    let buttonOuter = document.createElement('div')
    let button = document.createElement('button');
    let label = document.createElement('span');
    label.innerHTML = account.tags.join(' + ');
    button.innerHTML = account.id.slice(-3);
    button.onclick = (e) => {
        localStorage.setItem('accNo',account.id);
        location.assign('dashboard.html');
    }
    buttonOuter.appendChild(button);
    buttonOuter.appendChild(label);
    accDiv.appendChild(buttonOuter);

}





//DOMContentLoaded block end
})