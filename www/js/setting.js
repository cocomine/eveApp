/*
 * Copyright (c) 2021. By Cocomine
 */
'use strict'

document.addEventListener('deviceready', function () {
    let Setting;

    /* 載入設定 */
    $(document).on('onSettingLoad', function(e, Setting1){
        Setting = Setting1;
        $('#Rate > span').text(`1 港幣 = ${Setting["Rate"]} 人民幣`);
        $('#company-name-ZH > span').text(Setting["company-name-ZH"]);
        $('#company-name-EN > span').text(Setting["company-name-EN"]);
        $('#Driver-name > span').text(Setting["Driver-name"]);
        $('#Driver-license > span').text(Setting["Driver-license"]);
        $('#Decimal-places > span').text(Setting["Decimal_places"]);
        $('#Email-to > span').text(Setting["Email-to"]);
    });

    /* 線上更新匯率 */
    $("#Rate_online").click(function(e){
        $("#Rate_online > i").addClass("fa-spin");
        $.getJSON("https://exchange-rates.abstractapi.com/v1/live/?api_key=513ff6825b484fa2a9d38df074986a5d&base=HKD&target=CNY", function(data){
            const rates = data.exchange_rates.CNY.toFixed(3) //取小數點後三位
            console.log('匯率: ' + rates); //debug
            updateRates(rates); //更新匯率
        }).fail(function(){
            console.log( "獲取匯率失敗" ); //debug
            window.plugins.toast.showShortBottom("獲取匯率失敗");
            $("#Rate_online > i").removeClass("fa-spin");
        })
    });

    /* 手動更改匯率 */
    $("#Rate > span, #Rate > small").click(function (e) {
        navigator.notification.prompt(
            "請輸入1港元兌人民幣匯率",
            function (results) {
                if(results.buttonIndex === 1){
                    if(/^[0-9].[0-9]{0,3}$/g.test(results.input1)){
                        updateRates(results.input1); //更新匯率
                    }else{
                        window.plugins.toast.showShortBottom("輸入格式不正確 e.x: 0.123");
                    }
                }
            },
            '人民幣匯率',
            ['確認', '取消'],
            Setting.Rate
        );
    })

    /* 匯率更新 */
    function updateRates(rates){
        db.transaction(function(tr) {
            tr.executeSql("UPDATE Setting SET value = ? WHERE Target = 'Rate'", [rates]); //放入sql
            $("#Rate_online > i").removeClass("fa-spin");
        }, function (error) {
            console.log("匯率更新失敗 " + error.message); //debug
            window.plugins.toast.showShortBottom("匯率更新失敗");
            $("#Rate_online > i").removeClass("fa-spin");
        }, function () {
            Setting.Rate = rates;
            console.log("匯率更新成功"); //debug
            $('#Rate > span').text(`1 港幣 = ${rates} 人民幣`);
            window.plugins.toast.showShortBottom("匯率更新成功");
        });
    }

    /* 修改中文名稱 */
    $("#company-name-ZH").click(function(){
        navigator.notification.prompt(
            "請輸入中文公司名稱",
            function(results){
                if(results.buttonIndex === 1){
                    if(/^.+[\u4e00-\u9fa5]$/g.test(results.input1)){
                        db.transaction(function(tr){
                            tr.executeSql("UPDATE Setting SET value = ? WHERE Target = 'company-name-ZH'", [results.input1])
                        }, function(error){
                            console.log('傳輸錯誤: ' + error.message); //debug
                        }, function(){
                            Setting["company-name-ZH"] = results.input1;
                            console.log("中文公司名稱修改成功"); //debug
                            $('#company-name-ZH > span').text(results.input1);
                            window.plugins.toast.showShortBottom("中文公司名稱修改成功");
                        })
                    }else{
                        window.plugins.toast.showShortBottom("只能夠輸入中文");
                    }
                }
            },
            "中文公司名稱",
            ['確認', '取消'],
            Setting["company-name-ZH"]
        );
    });

    /* 修改英文名稱 */
    $("#company-name-EN").click(function(){
        navigator.notification.prompt(
            "請輸入英文公司名稱",
            function(results){
                if(results.buttonIndex === 1){
                    if(/^.+[a-zA-Z]$/g.test(results.input1)){
                        db.transaction(function(tr){
                            tr.executeSql("UPDATE Setting SET value = ? WHERE Target = 'company-name-EN'", [results.input1])
                        }, function(error){
                            console.log('傳輸錯誤: ' + error.message); //debug
                        }, function(){
                            Setting["company-name-EN"] = results.input1;
                            console.log("英文公司名稱修改成功"); //debug
                            $('#company-name-EN > span').text(results.input1);
                            window.plugins.toast.showShortBottom("英文公司名稱修改成功");
                        })
                    }else{
                        window.plugins.toast.showShortBottom("只能夠輸入英文");
                    }
                }
            },
            "英文公司名稱",
            ['確認', '取消'],
            Setting["company-name-EN"]
        );
    })

    /* 修改司機名稱 */
    $("#Driver-name").click(function(){
        navigator.notification.prompt(
            "請輸入司機名稱",
            function(results){
                if(results.buttonIndex === 1){
                    if(/^.+[a-zA-Z\u4e00-\u9fa5]$/g.test(results.input1)){
                        db.transaction(function(tr){
                            tr.executeSql("UPDATE Setting SET value = ? WHERE Target = 'Driver-name'", [results.input1])
                        }, function(error){
                            console.log('傳輸錯誤: ' + error.message); //debug
                        }, function(){
                            Setting["Driver-name"] = results.input1;
                            console.log("司機名稱修改成功"); //debug
                            $('#Driver-name > span').text(results.input1);
                            window.plugins.toast.showShortBottom("司機名稱修改成功");
                        })
                    }else{
                        window.plugins.toast.showShortBottom("只能夠輸入英文或中文");
                    }
                }
            },
            "司機名稱",
            ['確認', '取消'],
            Setting["Driver-name"]
        );
    })

    /* 修改車牌號碼 */
    $("#Driver-license").click(function(){
        navigator.notification.prompt(
            "請輸入車牌號碼",
            function(results){
                if(results.buttonIndex === 1){
                    if(/^.+[A-Z0-9]$/g.test(results.input1)){
                        db.transaction(function(tr){
                            tr.executeSql("UPDATE Setting SET value = ? WHERE Target = 'Driver-license'", [results.input1])
                        }, function(error){
                            console.log('傳輸錯誤: ' + error.message); //debug
                        }, function(){
                            Setting["Driver-license"] = results.input1;
                            console.log("車牌號碼修改成功"); //debug
                            $('#Driver-license > span').text(results.input1);
                            window.plugins.toast.showShortBottom("車牌號碼修改成功");
                        })
                    }else{
                        window.plugins.toast.showShortBottom("只能夠輸入英文和數字");
                    }
                }
            },
            "車牌號碼",
            ['確認', '取消'],
            Setting["Driver-license"]
        );
    })

    /* 修改小數位 */
    $("#Decimal-places").click(function(){
        navigator.notification.prompt(
            "請輸入要顯示小數點後幾位",
            function(results){
                if(results.buttonIndex === 1){
                    if(/^[0-9]$/g.test(results.input1)){
                        db.transaction(function(tr){
                            tr.executeSql("UPDATE Setting SET value = ? WHERE Target = 'Decimal_places'", [results.input1])
                        }, function(error){
                            console.log('傳輸錯誤: ' + error.message); //debug
                        }, function(){
                            Setting["Decimal_places"] = results.input1;
                            console.log("小數位修改成功"); //debug
                            $('#Decimal-places > span').text(results.input1);
                            window.plugins.toast.showShortBottom("小數位修改成功");
                        })
                    }else{
                        window.plugins.toast.showShortBottom("只能夠輸入數字");
                    }
                }
            },
            "小數位",
            ['確認', '取消'],
            Setting["Decimal_places"]
        );
    })

    /* 修改預設電郵地址 */
    $("#Email-to").click(function(){
        navigator.notification.prompt(
            "請輸入預設收件人電郵地址",
            function(results){
                if(results.buttonIndex === 1){
                    if(/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/g.test(results.input1)){
                        db.transaction(function(tr){
                            tr.executeSql("UPDATE Setting SET value = ? WHERE Target = 'Email-to'", [results.input1])
                        }, function(error){
                            console.log('傳輸錯誤: ' + error.message); //debug
                        }, function(){
                            Setting["Decimal_places"] = results.input1;
                            console.log("預設電郵地址修改成功"); //debug
                            $('#Email-to > span').text(results.input1);
                            window.plugins.toast.showShortBottom("預設電郵地址修改成功");
                        })
                    }else{
                        window.plugins.toast.showShortBottom("只能夠輸入電郵地址");
                    }
                }
            },
            "收件人",
            ['確認', '取消'],
            Setting["Email-to"]
        );
    })
});