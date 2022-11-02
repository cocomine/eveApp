/*
 * Copyright (c) 2021. By Cocomine
 */
'use strict'
//導航欄連結
$(".navbar > div > a").click(function(e){
    e.preventDefault();
    const url = $(this).attr('href');
    location.replace(url);
})

//連結
$("a[href]:not(.navbar > div > a)").click(function(e){
    if(!e.defaultPrevented){
        const url = $(this).attr('href');
        JumpPage(url);
    }
});

//Jump page
function JumpPage(url, direction = "left", duration = 150){
    const theOptions = {
        'direction': direction,
        'href': url,
        'duration': duration
    };
    window.plugins.nativepagetransitions.slide(theOptions);
}

//Go to index.html
function GoBackHome() {
    const theOptions = {
        'direction': 'right',
        'href': './index.html',
        'duration': 150,
    };
    window.plugins.nativepagetransitions.slide(theOptions);
}

let db = null; //資料庫實例
document.addEventListener('deviceready', function(){
    console.log('運行cordova-' + cordova.platformId + '@' + cordova.version);

    openDB();//打開資料庫
    loadSetting();//載入設定

    $.getScript(location.origin + '/js/global/upDateDatabase.js', function(){
        DatabaseVer_Helper.checkUpdate();
    })//檢查資料庫更新
    $.getScript(location.origin + '/js/global/AutoBackup.js', function(){
        AutoBackup.checkBackup();
    })//檢查資料庫更新
}, false);

/* 初始化資料庫*/
function openDB(){
    const dbname = localStorage.getItem("openDB") || "eveApp.db"
    console.log("Open Database: " + dbname);
    if(window.cordova.platformId === "browser") db = window.openDatabase(dbname, '1.0', 'eveApp', 2 * 1024 * 1024)
    else db = window.sqlitePlugin.openDatabase({name: dbname, location: 'default'});
}

/* 載入設定 */
function loadSetting(){
    db.transaction(function(tr){
        tr.executeSql("SELECT * FROM Setting", [], function(tx, rs){
            let Setting = [];
            for(let i = 0 ; i < rs.rows.length ; i++){
                Setting[rs.rows.item(i).Target] = rs.rows.item(i).value
            }
            $(document).trigger('onSettingLoad', [Setting])
        }, function(error){
            console.log('獲取失敗: ' + error.message); //debug
        });
    }, function(error){
        console.log('傳輸錯誤: ' + error.message); //debug
    })
}

/* 格式化金額 Thx: https://liaosankai.pixnet.net/blog/post/521987 */
function formatPrice(Str){
    Str = Str.toString();

    var digits = Str.toString().split('.'); // 先分左邊跟小數點
    var integerDigits = digits[0].split(""); // 獎整數的部分切割成陣列
    var threeDigits = []; // 用來存放3個位數的陣列

    // 當數字足夠，從後面取出三個位數，轉成字串塞回 threeDigits
    while(integerDigits.length > 3){
        threeDigits.unshift(integerDigits.splice(integerDigits.length - 3, 3).join(""));
    }

    threeDigits.unshift(integerDigits.join(""));
    digits[0] = threeDigits.join(',');

    return digits.join(".");
}
