
apiKey = localStorage.getItem('apiKey')
accNo = localStorage.getItem('accNo')
let stream,bidPrice,askPrice,midPrice,liveChart
let count = 0
const liveChartValues = [[],[]]
fetch(`https://stream-fxtrade.oanda.com/v3/accounts/${accNo}/pricing/stream?instruments=NATGAS_USD`,{headers : {'Authorization':`Bearer ${apiKey}`}})
.then((response)=>{
    stream = response.body.pipeThrough(new TextDecoderStream()).getReader()
}).then(()=>{
    streamRecursor()
})

function streamRecursor(){
    stream.read().
    then((chunk)=>{
        let parsed = JSON.parse(chunk.value)
        if (parsed.type == 'HEARTBEAT'){
            return
        }
        bidPrice = Number(parsed.closeoutBid)
        askPrice = Number(parsed.closeoutAsk)
        midPrice = (bidPrice+askPrice)/2
        try {
            document.querySelector('#midPrice').innerHTML = midPrice.toFixed(5)
        } catch (error) {
        }
        
    }).then(()=>{
        setTimeout(streamRecursor,300)
    })
    
}

function chartRecursor(){
    new Promise((resolve,reject)=>{
        date = new Date()
        let hrs = date.getHours()
        let mins = date.getMinutes()
        let secs = date.getSeconds()
        liveChartValues[0].push(`${hrs}:${mins}:${secs}`)
        liveChartValues[1].push(midPrice)
        liveChart.update()
        resolve()
    }).then(()=>{
        setTimeout(chartRecursor,500)
    })
}

document.addEventListener("DOMContentLoaded",(e)=>{
//DOMContentLoaded block start

document.querySelector('#logout').onclick = (e) =>{
    localStorage.clear();
    location.replace('login.html');
}

document.querySelector('#accounts').onclick = (e) =>{
    localStorage.removeItem('accNo');
    location.replace('accounts.html');
}

liveChart = new Chart("liveChart", {
type: "line",
data: {
    labels: liveChartValues[0],
    datasets: [{
    fill: false,
    lineTension: 0,
    backgroundColor: "rgba(0,0,255,1.0)",
    borderColor: "rgba(0,0,255,0.1)",
    pointRadius:0.5,
    data: liveChartValues[1]
    }]
}
});
chartRecursor();

//DOMContentLoaded block end
})