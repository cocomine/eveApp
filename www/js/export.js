/*
 * Copyright (c) 2021. By Cocomine
 */
'use strict';
let Setting;

document.addEventListener('deviceready', function(){
    /* 取得有資料的年份 */
    db.transaction(function(tr){
        tr.executeSql("SELECT STRFTIME('%Y', DateTime) AS Year FROM Record GROUP BY Year", [], function(tx, rs){
            //console.log(rs.rows); //debug
            for(let i = 0 ; i < rs.rows.length ; i++){
                const row = rs.rows.item(i);
                $('#Year').append('<option value="' + row.Year + '">' + row.Year + '</option>')
            }
        }, function(tx, error){
            console.log('取得資料錯誤: ' + error.message);
        });
    }, function(error){
        console.log('傳輸錯誤: ' + error.message);
    }, function(){
        console.log('已取得有資料的年份');
    });
});

/* 載入設定 */
$(document).on('onSettingLoad', function(e, Setting1){
    Setting = Setting1;
    Setting.Rate = parseFloat(Setting.Rate);
});

/* pdf輸出 */
$('form').submit(function(e){
    e.preventDefault();
    e.stopPropagation();
    const form = new FormData(this);
    const DateTime = moment(form.get('Year') + form.get('Month'));
    getRecordHTML(form.get('output-remark'), DateTime.format('MM'), DateTime.format('YYYY'), function(RecordHTML, Total){

        /* 彈出視窗輸入公司名稱 */
        navigator.notification.prompt(
            "請輸入公司名稱",
            function(results){
                if(results.buttonIndex === 1){

                    localStorage.setItem("toCompanyName", results.input1);
                    /* 轉換pdf */
                    const options = {
                        documentSize: 'A4',
                        type: 'share',
                        fileName: Setting["company-name-ZH"].substr(0, 2) + ' ' + form.get('Month') + '月(' + localStorage.getItem("toCompanyName") + ').pdf',
                        landscape: "landscape",
                    }

                    const html = HTMLData(DateTime.format('YYYY年 M月'), Total, RecordHTML, localStorage.getItem("toCompanyName"));
                    //console.log(html); //debug

                    pdf.fromData(html, options).then(function(stats){
                        console.log('PDF輸出', stats)
                    }).catch(function(err){
                        console.log(err)
                    })

                }
            },
            '致...',
            ['確認', '取消'],
            localStorage.getItem("toCompanyName")
        );
    }, function(error){
        window.plugins.toast.showShortBottom(error);
    });
})

/* 寄電郵 */
$('#SendEmail').click(function(e){
    e.preventDefault();
    e.stopPropagation();

    const form = new FormData($('form')[0]);
    const DateTime = moment(form.get('Year') + form.get('Month'));
    getRecordHTML(form.get('output-remark'), DateTime.format('MM'), DateTime.format('YYYY'), function(RecordHTML, Total){

        /* 彈出視窗輸入公司名稱 */
        navigator.notification.prompt(
            "請輸入公司名稱",
            function(results){
                if(results.buttonIndex === 1){

                    localStorage.setItem("toCompanyName", results.input1);
                    /* 轉換pdf */
                    const options = {
                        documentSize: 'A4',
                        type: 'base64',
                        landscape: "landscape",
                    }

                    const html = HTMLData(DateTime.format('YYYY年 M月'), Total, RecordHTML, localStorage.getItem("toCompanyName"));
                    //console.log(html); //debug

                    pdf.fromData(html, options).then(function(base64){
                        //console.log(base64);
                        cordova.plugins.email.open({
                            app: 'mailto',
                            to: Setting['Email-to'], // email addresses for TO field
                            attachments: ['base64:' + Setting["company-name-ZH"].substr(0, 2) + ' ' + form.get('Month') + '月.pdf' + '//' + base64], // file paths or base64 data streams
                            subject: Setting["company-name-ZH"].substr(0, 2) + ' ' + form.get('Month') + '月 月結單', // subject of the email
                            body: `致 ${localStorage.getItem("toCompanyName")}:\n\n${Setting["company-name-ZH"]} ${form.get('Month')}月的月結單, 已包在附件中。請查收。\n\n${Setting["company-name-ZH"]}\n${Setting["Driver-name"]}`, // email body
                        });
                    }).catch(function(err){
                        console.log(err)
                    });
                }
            },
            '致...',
            ['確認', '取消'],
            localStorage.getItem("toCompanyName")
        );

    }, function(error){
        window.plugins.toast.showShortBottom(error);
    });
})

/* 套入html模板 */
function HTMLData(Date, Total, HTML_body, toCompanyName){
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>PDF_Template</title>
    <link rel="stylesheet" href="file:///android_asset/www/css/bootstrap.min.css">
    <style>
        tr > td:nth-child(6) {
            border-left: 1px solid lightgray;
        }

        tr > td:nth-child(8) {
            border-right: 1px solid lightgray;
        }

        tbody > tr:nth-child(2n) {
            background-color: #f3c198;
        }
        body{
            font-size: 10px;
        }
    </style>
</head>
<body>
<h2 style="text-align: center" id="company-name-ZH">${Setting["company-name-ZH"]}</h2>
<h5 style="text-align: center" id="company-name-EN">${Setting["company-name-EN"]}</h5>
<p></p>
<div class="row align-items-end" style="background-color: #a7d086">
    <div class="col" style="font-size: 1.5em">致 ${toCompanyName}</div>
    <div class="col-auto" id="Date" style="font-size: 1.2em">${Date}</div>
    <div class="col-auto" id="Driver-license" style="font-size: 1.2em">車牌: ${Setting["Driver-license"]}</div>
    <div class="col-auto" id="Driver-name" style="font-size: 1.2em">司機: ${Setting["Driver-name"]}</div>
</div>
<table class="table table-sm">
    <thead>
    <tr>
        <th scope="col" colspan="5"></th>
        <th scope="col" colspan="3" style="border-left: 1px solid lightgray; border-right: 1px solid lightgray; text-align: center">代付</th>
        <th scope="col" colspan="3"></th>
    </tr>
    <tr>
        <th scope="col" >日期</th>
        <th scope="col">單號</th>
        <th scope="col">櫃號</th>
        <th scope="col">類型</th>
        <th scope="col">地點</th>
        <th scope="col" style="border-left: 1px solid lightgray">人民幣</th>
        <th scope="col">折算</th>
        <th scope="col" style="border-right: 1px solid lightgray">港幣</th>
        <th scope="col">加收</th>
        <th scope="col">運費</th>
        <th scope="col">合計</th>
    </tr>
    </thead>
    <tbody>
    ${HTML_body}
    </tbody>
    <tfoot>
    <tr>
        <td colspan="5" id="Rate">匯率: 1 港幣 = ${Setting.Rate} 人民幣</td>
        <td colspan="6" style="text-align: right; font-size: 1.5em" id="monthTotal">總計: HK$ ${Total}</td>
    </tr>
    </tfoot>
</table>
<p style="text-align: center">- 終 -</p>
</body>
<footer>
    <div style="color: gray; font-size: .5em; text-align: right">本PDF檔案由 運輸紀錄 應用程式生成</div>
</footer>
</html>`
}

/* 數字0替換為空白 */
function blankNum(num, sign){
    if(num === 0){
        return "";
    }else{
        return sign + " " + formatPrice(num.toFixed(Setting["Decimal_places"]));
    }
}

/* 取得當月紀錄*/
function getRecordHTML(isOutputRemark, outputDateMonth, outputDateYear, output, error){
    db.transaction(function(tr){
        console.log("顯示: ", outputDateMonth, outputDateYear);
        tr.executeSql("SELECT * FROM Record WHERE STRFTIME('%m', DateTime) = ? AND STRFTIME('%Y', DateTime) = ? ORDER BY DateTime ASC", [outputDateMonth, outputDateYear], function(tx, rs){
            if(rs.rows.length <= 0){
                error('沒有資料');
                return false;
            }
            let Total = {
                Month: 0.0,
                RMB: 0.0,
                HKD: 0.0,
                ADD: 0.0,
                Shipping: 0.0,
                Change: 0.0
            };
            let html = '';
            //console.log(rs.rows); //debug
            /* 打印紀錄 */
            for(let i = 0 ; i < rs.rows.length ; i++){
                const row = rs.rows.item(i);
                console.log(row); //debug
                row.DateTime = moment(row.DateTime);
                row.CargoNum = '<b>' + row.CargoNum.slice(0, 4) + '</b>' + row.CargoNum.slice(4, 10) + '(' + row.CargoNum.slice(10) + ')';

                //進行計算
                let Change = parseFloat((row.RMB / Setting.Rate).toFixed(2));
                let rowTotal = Change + row.HKD + row.Add + row.Shipping;
                Total.Month += rowTotal;
                rowTotal = blankNum(rowTotal, "$");
                Total.RMB += row.RMB;
                row.RMB = blankNum(row.RMB, "CN¥");
                Total.Change += Change;
                Change = blankNum(Change, "$");
                Total.HKD += row.HKD;
                row.HKD = blankNum(row.HKD, "$")
                Total.ADD += row.Add;
                row.Add = blankNum(row.Add, "$");
                Total.Shipping += row.Shipping;
                row.Shipping = blankNum(row.Shipping, "$");
                //console.log(Total); //debug

                //放入html
                html += `
                    <tr>
                        <th scope="row">${row.DateTime.format('D')}</th>
                        <td>${row.OrderNum}</td>
                        <td>${row.CargoNum}</td>
                        <td>${row.Type}</td>
                        <td>${row.Local}<br><span style="color: gray">${isOutputRemark ? (row.Remark === null ? '' : row.Remark) : ''}</span></td>
                        <td>${row.RMB}</td>
                        <td>${Change}</td>
                        <td>${row.HKD}</td>
                        <td>${row.Add}</td>
                        <td>${row.Shipping}</td>
                        <td>${rowTotal}</td>
                    </tr>`;
            }
            html += `
                <tr style="font-size: 1.1em; background-color: lightskyblue">
                    <th scope="row" colspan="5" style="text-align: center">各項總計</th>
                    <td style="border-left: 1px solid lightgray">CN¥ ${formatPrice(Total.RMB.toFixed(Setting["Decimal_places"]))}</td>
                    <td>$ ${formatPrice(Total.Change.toFixed(Setting["Decimal_places"]))}</td>
                    <td style="border-right: 1px solid lightgray">$ ${formatPrice(Total.HKD.toFixed(Setting["Decimal_places"]))}</td>
                    <td>$ ${formatPrice(Total.ADD.toFixed(Setting["Decimal_places"]))}</td>
                    <td style="border-width: 0">$ ${formatPrice(Total.Shipping.toFixed(Setting["Decimal_places"]))}</td>
                    <td> </td>
                </tr>`;
            output(html, Total.Month.toFixed(Setting["Decimal_places"]));
            return false;
        }, function(tx, error){
            error('取得資料錯誤: ' + error.message);
        });
    }, function(error){
        error('傳輸錯誤: ' + error.message);
    });
}