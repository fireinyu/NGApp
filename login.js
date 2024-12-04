document.addEventListener("DOMContentLoaded",(e)=>{
    document.querySelector('#form').onsubmit = () =>{
        const apiKey = document.querySelector('#apiKey').value;
        fetch(`https://api-fxtrade.oanda.com/v3/accounts`,{headers : {'Authorization':`Bearer ${apiKey}`}})
        .then((response)=>{
            return new Promise((resolve,reject)=>{
                if (response.status === 200){
                    resolve(response)
                }
                reject(response.status)
            })
        })
        .then((response)=>{
            localStorage.setItem('apiKey',apiKey)
            response.json().then((jsonObj)=>{
                console.log(jsonObj)
                localStorage.setItem('accounts',JSON.stringify(jsonObj.accounts))

            })
            location.replace('accounts.html')
            }      
        ,(status)=>{
            document.querySelector('#apiKey').value = '';
            alert(`login rejected with status code ${status}`)
        })
        
        return false
        
    }

        
})