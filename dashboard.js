
apiKey = localStorage.getItem('apiKey')
accNo = localStorage.getItem('accNo')
let stream,bidPrice,askPrice,midPrice,liveChart,hist,epoch
let count = 0
const priceData = []

Promise.all([
    fetch(`https://stream-fxtrade.oanda.com/v3/accounts/${accNo}/pricing/stream?instruments=NATGAS_USD`,{headers : {'Authorization':`Bearer ${apiKey}`,'Accept-Datetime-Format':"UNIX"}})
    .then((response)=>{
        stream = response.body.pipeThrough(new TextDecoderStream()).getReader()
    }),
    fetch(`https://api-fxtrade.oanda.com/v3/accounts/${accNo}/instruments/NATGAS_USD/candles?count=720&granularity=M2`,{headers : {'Authorization':`Bearer ${apiKey}`,'Accept-Datetime-Format':"UNIX"}})
    .then((response) => {
        return response.json()
        .then ((jsonObj)=>{
            hist = jsonObj.candles
            console.log(hist)
        })
    })
])
.then(()=>{
    let len = hist.length
    
    for (let i = 0;i<len-1;i++){
        let thisDate = new Date(Number(hist[i].time*1000));
        let hh = String(thisDate.getHours()).padStart(2,'0');
        let mm = String(thisDate.getMinutes()).padStart(2,'0');
        let ss = String(thisDate.getSeconds()).padStart(2,'0');
        priceData.push({x:120*(i+1-len),y:Number(hist[i].mid.o),label:`${hh}:${mm}:${ss}`})
    }
    epoch = hist[len-1].time
    let thisDate = new Date(Number(hist[len-1].time*1000));
    let hh = String(thisDate.getHours()).padStart(2,'0');
    let mm = String(thisDate.getMinutes()).padStart(2,'0');
    let ss = String(thisDate.getSeconds()).padStart(2,'0');
    priceData.push({x:0,y:Number(hist[len-1].mid.o),label:`${hh}:${mm}:${ss}`})
    liveChart.options.axisX.stripLines =[{
        value:0,
        label:`epoch = ${hh}:${mm}:${ss}`,
        labelFontColor:'grey',
        color:'grey'
    }]

    streamRecursor()
})
    



function streamRecursor(){
    stream.read().
    then((chunk)=>{
        let parsed = JSON.parse(chunk.value)
        if (parsed.type == 'PRICE'){
            bidPrice = Number(parsed.closeoutBid)
            askPrice = Number(parsed.closeoutAsk)
            midPrice = (bidPrice+askPrice)/2
        }
        try {
            document.querySelector('#midPrice').innerHTML = midPrice.toFixed(5)
            priceData.slice(-1)[0].markerSize = 1;
            priceData.slice(-1)[0].markerColor = 'orange';
            priceData.push({x:Number(parsed.time)-epoch,y:midPrice,markerSize:6,markerColor:'red'})
            liveChart.render()
        } catch (error) {
        }
        
        
        
        
    }).then(()=>{
        setTimeout(streamRecursor,300)
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

liveChart = new CanvasJS.Chart('liveChartContainer',{
    zoomEnabled:true,
    margin:10,
    title:{
        text:'Live Natural Gas Price'
    },
    axisX:{
        gridThickness:0.3,
        gridDashType:'dash',
        valueFormatString:'###s',

        crosshair:{
            enabled:true,
            thickness:0.5,
        }
    },
    axisY:{
        gridThickness:0,
        interlacedColor: "#F0F8FF",
        crosshair:{
            enabled:true,
            thickness:0.5
        }
    },
    data:[
        {
            toolTipContent:'{x}s from epoch, price:{y}',     
            type: 'line',
            name: 'mid price',
            showInLegend:true,
            markerType:'circle',
            markerColor:'orange',
            markerSize:1,
            color:'orange',
            dataPoints:priceData
        },
        {
            toolTipContent:null

        }
    ]
});

//DOMContentLoaded block end
})