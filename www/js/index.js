/*
 * Copyright (c) 2021. By Cocomine
 */

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
'use strict'
$('.scrollbar-inner').scrollbar();
let ShowDay = new Date();
if(sessionStorage.getItem("ShowDay") !== null){
    ShowDay = new Date(sessionStorage.getItem("ShowDay"));
    sessionStorage.removeItem("ShowDay");
}

/* 選擇顯示月份 */
function NextMonth(){
    ShowDay.setMonth(ShowDay.getMonth() + 1)
    print_Record();
}

function LastMonth(){
    ShowDay.setMonth(ShowDay.getMonth() - 1);
    print_Record();
}

$('#Last-month').on("click", LastMonth);
$('#Next-month').on("click", NextMonth);


let toggleShow = false; //人民幣未顯示
let canVibrate = true; //可震動
let Setting; //設定

/* 人民幣折算顯示切換 */
$(document).on('click', '.data-body', function(){
    if(toggleShow){
        $("[data-show-type='After-Convert']").show();
        $("[data-show-type='Befor-Convert']").hide();
        toggleShow = false;
    }else{
        $("[data-show-type='After-Convert']").hide();
        $("[data-show-type='Befor-Convert']").show();
        toggleShow = true;
    }
})

    /* 跳出編輯紀錄 */
    .on('touchend', '.swipe-container', function(){
    const minDistance = 150;
    const container = this;
    const swipeDistance = container.scrollLeft - container.clientWidth;
    if(swipeDistance < minDistance * -1){
        //編輯紀錄
        const recordID = $(container).find('.data-body').data('recordid');
        sessionStorage.setItem("ShowDay", ShowDay.toISOString()); //臨時儲存現在顯示的月份
        JumpPage('edit.html#' + recordID);
    }else if(swipeDistance > minDistance){
        //刪除資料
        $(container).slideUp('fast')
        const recordID = $(container).find('.data-body').data('recordid');
        db.transaction(function(tr){
            tr.executeSql("DELETE FROM Record WHERE RecordID = ?", [recordID]);
        }, function(error){
            console.log('傳輸錯誤: ' + error.message); //debug
        });
    }else{
        //console.log(`did not swipe ${minDistance}px`);
    }
})

    /* 震動回饋 */
    .on('touchmove', '.swipe-container', function(){
    const minDistance = 150;
    const container = this;
    const swipeDistance = container.scrollLeft - container.clientWidth;
    if(swipeDistance < minDistance * -1){
        if(canVibrate === true){
            navigator.vibrate(10);
            canVibrate = false;
        }
    }else if(swipeDistance > minDistance){
        if(canVibrate === true){
            navigator.vibrate(10);
            canVibrate = false;
        }
    }else{
        canVibrate = true;
    }
});
document.addEventListener('deviceready', function(){

    $(document).on("backbutton", function(){
        navigator.app.exitApp();
    }); //後退按鈕

    /* 顯示當前月份 */
    $('#month').text(moment(ShowDay).format('M月 YYYY'))

    /* 載入設定 */
    $(document).on('onSettingLoad', function(e, Setting1){
        Setting = Setting1;
        Setting["Rate"] = parseFloat(Setting["Rate"]);
        print_Record();
    });


}, false);

/* 打印紀錄 */
function print_Record(){
    /* 取得當月紀錄*/
    db.transaction(function(tr){
        console.log("顯示: ", moment(ShowDay).format("MM"), moment(ShowDay).format("YYYY"));
        tr.executeSql("SELECT * FROM Record WHERE STRFTIME('%m', DateTime) = ? AND STRFTIME('%Y', DateTime) = ? ORDER BY DateTime DESC", [moment(ShowDay).format("MM"), moment(ShowDay).format("YYYY")], function(tx, rs){
            const Content = $('#Content');
            $('#month').text(moment(ShowDay).format('M月 YYYY'))

            //沒有資料
            if(rs.rows.length <= 0){
                Content.addClass('h-100');
                Content.html(
                    '<div class="row align-items-center h-100 g-0 text-center">' +
                    '   <div class="col-12" style="color: var(--text-gary);">' +
                    '       <img src="img/lost-cago.svg" alt="沒有資料" height="80rem">' +
                    '       <div class="pt-2">沒有資料... （；´д｀）ゞ</div>' +
                    '   </div>' +
                    '</div>');
                $('#Item-Total > div:nth-child(n+1) > span, #Month-Total').text('0.0')
                getNote(true);//備忘錄
                return;
            }

            //有資料
            const package_list = package_HTML(rs);//打包資料
            const Grouping_list = Grouping_HTML(package_list);//資料分組
            Content.html('');//清除畫面
            Content.removeClass('h-100');//移除強制高度
            Convert_to_HTML(Grouping_list, function(html){//打印畫面
                Content.append(html);//分段打印
            }, function(Month_Total, RMB_Total, HKD_Total, Add_Total, Shipping_Total){
                //完成打印 後執行
                $('#Item-Total > div:nth-child(1) > span').text(formatPrice(RMB_Total.toFixed(Setting["Decimal_places"])))
                $('#Item-Total > div:nth-child(2) > span').text(formatPrice(HKD_Total.toFixed(Setting["Decimal_places"])))
                $('#Item-Total > div:nth-child(3) > span').text(formatPrice(Add_Total.toFixed(Setting["Decimal_places"])))
                $('#Item-Total > div:nth-child(4) > span').text(formatPrice(Shipping_Total.toFixed(Setting["Decimal_places"])))

                $('#Month-Total').text(formatPrice(Month_Total.toFixed(Setting["Decimal_places"])));

                getNote();//備忘錄

                /* 跳到修改中的記錄id */
                const offsetTop = $("[data-day='" + moment(ShowDay).format("DD") + "']")[0].offsetTop;
                $('.scrollbar-inner').scrollTop(offsetTop);
            });
        }, function(tx, error){
            console.log('取得資料錯誤: ' + error.message);
        });
    }, function(error){
        console.log('傳輸錯誤: ' + error.message);
    }, function(){
        console.log('已取得資料');
    });
}

/* 打包資料 */
function package_HTML(ResultSet){
    const package_list = [];
    for(let i = 0 ; i < ResultSet.rows.length ; i++){
        //放入變數
        const row = ResultSet.rows.item(i);
        row.DateTime = new Date(row.DateTime);

        //進行計算
        const Change = (row.RMB / Setting["Rate"]);
        const Total = Change + row.HKD + row.Add + row.Shipping;
        row.CargoNum = '<b>' + row.CargoNum.slice(0, 4) + '</b>' + row.CargoNum.slice(4, 10) + '(' + row.CargoNum.slice(10) + ')';
        if(row.OrderNum === "") row.OrderNum = "(沒有單號)"
        //console.log(row.RecordID, row.DateTime, row.OrderNum, row.Type, row.CargoNum, row.Local, row.RMB, row.HKD, row.Add, row.Shipping, '+', Change, Total); //debug

        //放入html
        const html = `
                <div class="swipe-container">
                    <div class="action left">
                        <i class="fa fa-edit"></i>
                    </div>
                    <div class="swipe-element">
                        <div class="data-body row" data-RecordID="${row.RecordID}"">
                            <div class="col-3 col-md-2 col-lg-1" data-col-type="Num-Type">
                                <span>${row.OrderNum}</span><br>
                                <span>${row.Type}</span>
                            </div>
                            <div class="col" data-col-type="Local-Cargo">
                                <span>${row.Local}</span><br>
                                <span>${row.CargoNum}</span>
                            </div>
                            <div class="w-100"></div>
                            <div class="col-12" data-col-type="Remark">
                                <span>${row.Remark === null ? '' : row.Remark}</span>
                            </div>
                            <div class="col row Pay-on" data-col-type="Pay-on">
                                <div class="col-auto">代付</div>
                                <div class="col">
                                    <div data-show-type="After-Convert"><small>折算</small><span>$ ${formatPrice(Change.toFixed(Setting["Decimal_places"]))}</span></div>
                                    <div data-show-type="Befor-Convert" style="display: none"><small>人民幣</small><span>¥ ${formatPrice(row.RMB)}</span></div>
                                    <small>港幣</small><span>$ ${formatPrice(row.HKD)}</span>
                                </div>
                            </div>
                            <div class="col" data-col-type="Shipping">
                                <small>加收</small><span>$ ${formatPrice(row.Add)}</span><br>
                                <small>運費</small><span>$ ${formatPrice(row.Shipping)}</span>
                            </div>
                            <div class="w-100"></div>
                            <div data-col-type="Total" class="col"><small>合計</small>HK$ ${formatPrice(Total.toFixed(Setting["Decimal_places"]))}</div>
                        </div>
                    </div>
                    <div class="action right">
                        <i class="bi bi-trash"></i>
                    </div>
                </div>`

        //放入資料
        const package_item = {
            'DateTime': row.DateTime,
            'Total': Total,
            'html': html,
            'RMB': row.RMB,
            'HKD': row.HKD,
            'Add': row.Add,
            'Shipping': row.Shipping
        }
        package_list.push(package_item)
    }
    // console.log(package_list); //debug
    return package_list;
}

/* 資料分組 */
function Grouping_HTML(package_list){
    const Grouping_list = [];
    for(let i = 0 ; i < package_list.length ; i++){
        //console.log(package_list[i]);
        if(i !== 0){
            if(package_list[i]['DateTime'].getDay() === package_list[i - 1]['DateTime'].getDay()){ //如果是相同日期
                Grouping_list[Grouping_list.length - 1].push(package_list[i]); //就跟上一個合併
            }else{
                Grouping_list.push([package_list[i]]); //否則開新行
            }
        }else{
            Grouping_list.push([package_list[i]]); //第一個開新行
        }
    }
    //console.log(Grouping_list) //debug
    return Grouping_list;
}

/* 轉換為HTML */
function Convert_to_HTML(Grouping_list, html_output, Item_Total){
    let [Month_Total, RMB_Total, HKD_Total, Add_Total, Shipping_Total] = [0, 0, 0, 0, 0]
    for(let i = 0 ; i < Grouping_list.length ; i++){
        /* head */
        let TotalOfDay = 0;
        let body = '';
        const Date = moment(Grouping_list[i][0]['DateTime']).locale('zh-hk');

        /* body */
        for(let n = 0 ; n < Grouping_list[i].length ; n++){
            body += Grouping_list[i][n]['html'];
            TotalOfDay += Grouping_list[i][n]['Total'];

            //計算總額
            Month_Total += Grouping_list[i][n]['Total'];
            RMB_Total += Grouping_list[i][n]['RMB'];
            HKD_Total += Grouping_list[i][n]['HKD'];
            Add_Total += Grouping_list[i][n]['Add'];
            Shipping_Total += Grouping_list[i][n]['Shipping'];
        }

        /* foot */
        TotalOfDay = TotalOfDay.toFixed(Setting["Decimal_places"])
        const Day = Date.format('D'); //取得日子

        //根據星期幾安排css class
        let weekUseClass = 'WD' //預設平日
        if(Date.format('d') === '0'){
            weekUseClass = 'SD'; //星期日
        }else if(Date.format('d') === '6'){
            weekUseClass = 'ED'; //星期六
        }
        const week = Date.format('dddd'); //取得星期
        const monthYear = Date.format('M.YYYY'); //取得月份和年份
        //console.log(Day, weekUseClass, week, monthYear); //debug

        //放入html
        const html = `<div class="col-12 data-part" data-day="${Date.format('DD')}">
                <div class="data-head row align-items-center">
                    <span>${Day}</span>
                    <span class="${weekUseClass}">${week}</span>
                    <span>${monthYear}</span>
                    <div class="col"></div>
                    <span>HK$ ${formatPrice(TotalOfDay)}</span>
                </div>` + body + '</div>';

        html_output(html) //callback html
    }

    Item_Total(Month_Total, RMB_Total, HKD_Total, Add_Total, Shipping_Total) //當運行完結時callback
}

/* 取得當月備忘錄*/
function getNote(Content_isEmpty = false){
    db.transaction(function(tr){
        console.log("備忘錄顯示: ", moment(ShowDay).format("MM"), moment(ShowDay).format("YYYY"));
        tr.executeSql("SELECT * FROM Note WHERE STRFTIME('%m', DateTime) = ? AND STRFTIME('%Y', DateTime) = ? ORDER BY DateTime DESC ", [moment(ShowDay).format("MM"), moment(ShowDay).format("YYYY")], function(tx, rs){
            if(rs.rows.length <= 0) return;
            const Content = $('#Content');
            //如果沒有任何紀錄
            if(Content_isEmpty){
                Content.html('');//清除畫面
                Content.removeClass('h-100');//移除強制高度
            }

            //打包資料
            let note_list = [];
            for(let i = 0 ; i < rs.rows.length ; i++){
                const row = rs.rows.item(i);
                const html = `<li class="note-${row.Color.substr(3)}"><a href="page/Notepad/index.html#${row.ID}" class="text-truncate">${row.Title || row.Contact}</a></li>`
                const note = {
                    'DateTime': new Date(row.DateTime),
                    'html': html
                }
                note_list.push(note);
            }

            //資料分組
            const Grouping_list = Grouping_HTML(note_list);
            //console.log(Grouping_list);

            //轉換為HTML
            for(let i = 0 ; i < Grouping_list.length ; i++){
                let body = '';
                const Date = moment(Grouping_list[i][0]['DateTime']).locale('zh-hk');

                /* body */
                for(let n = 0 ; n < Grouping_list[i].length ; n++){
                    body += Grouping_list[i][n]['html'];
                }
                //放入html
                const html = `<div class="data-note"><ul>` + body + '</ul></div>';

                //插入已存在的data_part
                const data_part = $(`[data-day='${Date.format('DD')}']`)
                if(data_part.length){
                    //如果已經存在
                    data_part.children('.data-head').after(html);//插入

                }else{
                    //如果不存在
                    //根據星期幾安排css class
                    let weekUseClass = 'WD' //預設平日
                    if(Date.format('d') === '0'){
                        weekUseClass = 'SD'; //星期日
                    }else if(Date.format('d') === '6'){
                        weekUseClass = 'ED'; //星期六
                    }
                    const week = Date.format('dddd'); //取得星期
                    const monthYear = Date.format('M.YYYY'); //取得月份和年份
                    let Day = Date.format('D'); //取得日子
                    const data_part = ` 
                        <div class="col-12 data-part" data-day="${Date.format('DD')}">
                            <div class="data-head row align-items-center">
                            <span>${Day}</span>
                            <span class="${weekUseClass}">${week}</span>
                            <span>${monthYear}</span>
                            <div class="col"></div>
                            <span>HK$ 0.00</span>
                        </div>` + html + '</div>';//html

                    //插入
                    let checkDay = Date.format('D');
                    //沒有任何紀錄做法
                    if(Content_isEmpty){
                        Content.append(data_part);
                        continue;
                    }
                    //有紀錄做法
                    do{
                        checkDay++;
                        //console.log(checkDay < 32);
                        const next_data_part = $(`div[data-day='${checkDay}']`);
                        //找到相同的做法
                        if(next_data_part.length){
                            next_data_part.after(data_part);
                            break;
                        }
                        //找不到相同的做法
                        if(checkDay === 31){
                            Content.prepend(data_part)
                        }
                    }while(checkDay < 32);

                }
            }
        }, function(tx, error){
            console.log('取得資料錯誤: ' + error.message);
        });
    }, function(error){
        console.log('傳輸錯誤: ' + error.message);
    }, function(){
        console.log('已取得資料');
    });
}