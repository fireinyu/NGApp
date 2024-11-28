document.addEventListener("DOMContentLoaded",(e)=>{
    document.querySelector('#form').onsubmit = () =>{
        const apiKey = document.querySelector('#apiKey').value;
        const accNo = document.querySelector('#accNo').value;
        fetch(`https://api-fxtrade.oanda.com/v3/accounts/${accNo}`,{headers : {'Authorization':`Bearer ${apiKey}`}})
        .then((response)=>{
            return new Promise((resolve,reject)=>{
                if (response.status === 200){
                    resolve()
                }
                reject(response.status)
            })
        })
        .then(()=>{
            location.replace('dashboard.html')
            }      
        ,(status)=>{
            alert(`login rejected with status code ${status}`)
        })
        localStorage.setItem('accNo',accNo)
        localStorage.setItem('apiKey',apiKey)
        return false
        
    }

        
})