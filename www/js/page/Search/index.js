/*
 * Copyright (c) 2022. By Cocomine
 */
$('.scrollbar-inner').scrollbar();
let ShowDay = moment(new Date());

/* 選擇顯示月份 */
$('#Last-month').on("click", () => {
    ShowDay.subtract(1, 'M')
    updateDisplay();

});
$('#Next-month').on("click", () => {
    ShowDay.add(1, 'M')
    updateDisplay();
});

/* 選擇顯示週 */
$('#Last-week').on("click", () => {
    ShowDay.subtract(1, 'w')
    updateDisplay();
});
$('#Next-week').on("click", () => {
    ShowDay.add(1, 'w')
    updateDisplay();
});

/* 選擇顯示年 */
$('#Last-year').on("click", () => {
    ShowDay.subtract(1, 'y')
    updateDisplay();
});
$('#Next-year').on("click", () => {
    ShowDay.add(1, 'y')
    updateDisplay();
});

/* 選擇顯示自訂 */
$('#custom-mode-start').change((e) => {
    //console.log('Start', e.target.value)
    get_record();
});
$('#custom-mode-end').change((e) => {
    //console.log('End', e.target.value)
    get_record();
});

/* 關鍵字搜尋 */
$('#search').keyup((e) => {
    if(e.key === 'Enter' || e.keyCode === 13){
        get_record(e.target.value);
    }
});

/* 更新顯示日期 */
function updateDisplay(){
    console.log("顯示: ", ShowDay.format("DD MM YYYY"));
    $('#month').text(ShowDay.format('M月 YYYY'))
    $('#week').text(moment(ShowDay).startOf("week").format('D.M.YYYY') + ' ~ ' + moment(ShowDay).endOf("week").format('D.M'));
    $('#year').text(ShowDay.format('YYYY'));
    $('#custom-mode-start').val(moment(ShowDay).startOf("month").format('YYYY-MM-DD'));
    $('#custom-mode-end').val(moment(ShowDay).endOf("month").format('YYYY-MM-DD'));
    get_record($('#search').val());
}

/* 取得紀錄 */
function get_record(keyword = ''){
    let sqlQuery = "";
    let sqlValue = [];
    switch(showMode){
        case 1:
            sqlQuery = "WHERE STRFTIME('%Y-%m-%d', DateTime) BETWEEN ? AND ?";
            sqlValue = [moment(ShowDay).startOf("week").format("YYYY-MM-DD"), moment(ShowDay).endOf("week").format("YYYY-MM-DD")];
            break;
        case 4:
            sqlQuery = "WHERE STRFTIME('%Y-%m-%d', DateTime) BETWEEN ? AND ?";
            sqlValue = [$('#custom-mode-start').val(), $('#custom-mode-end').val()];
            break;
        case 2:
            sqlQuery = "WHERE STRFTIME('%m', DateTime) = ? AND STRFTIME('%Y', DateTime) = ?";
            sqlValue = [ShowDay.format("MM"), ShowDay.format("YYYY")];
            break;
        case 3:
            sqlQuery = "WHERE STRFTIME('%Y', DateTime) = ?";
            sqlValue = [ShowDay.format("YYYY")];
            break;
        default:
            sqlQuery = "WHERE true"
            break;
    }
    if(keyword !== ''){
        sqlQuery += " AND (OrderNum LIKE ? OR Type LIKE ? OR CargoNum LIKE ? OR Local LIKE ?)";
        keyword = "%" + keyword + "%"
        sqlValue.push(keyword, keyword, keyword, keyword);
    }

    console.log(showMode);
    console.log(sqlQuery);
    console.log(sqlValue);
    print_Record(`SELECT *
                  FROM Record ${sqlQuery}
                  ORDER BY DateTime ASC`, sqlValue);
}

let showMode = 2 //顯示模式, 0 全部, 1 週, 2 月, 3 年, 4 自訂
let toggleShow = false; //人民幣未顯示
let canVibrate = true; //可震動
let Setting; //設定

/* 選擇顯示模式 */
$('.dropdown-item').click((e) => {
    e.preventDefault();
    $('[data-show="1"]').hide().attr('data-show', 0);
    const dropdownMenu = $('#dropdownMenu');
    switch($(e.target).data('mode')){
        case "all-mode":
            showMode = 0;
            dropdownMenu.text('全部');
            $('#all-mode').show().attr('data-show', 1);
            break;
        case "week-mode":
            showMode = 1;
            dropdownMenu.text('週');
            $('#week-mode').show().attr('data-show', 1);
            break;
        case "month-mode":
            showMode = 2;
            dropdownMenu.text('月');
            $('#month-mode').show().attr('data-show', 1);
            break;
        case "year-mode":
            showMode = 3;
            dropdownMenu.text('年');
            $('#year-mode').show().attr('data-show', 1);
            break;
        case "custom-mode":
            showMode = 4;
            dropdownMenu.text('自訂');
            $('#custom-mode').show().attr('data-show', 1);
            break;
    }
    updateDisplay();
})

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
        StatusBar.backgroundColorByHexString('#127dff')
        JumpPage('./edit.html#' + recordID);
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

    StatusBar.backgroundColorByHexString('#483D8B')

    $(document).on("backbutton", turnBack); //後退按鈕
    $('a[href="/index.html"]').click(turnBack);

    function turnBack(){
        StatusBar.backgroundColorByHexString('#127dff')
        GoBackHome();
    }

    /* 更新顯示日期 */
    updateDisplay();

    /* 載入設定 */
    $(document).on('onSettingLoad', function(e, Setting1){
        Setting = Setting1;
        Setting["Rate"] = parseFloat(Setting["Rate"]);
    });

}, false);

/* 打印紀錄 */
function print_Record(sqlQuery, sql){
    /* 取得當月紀錄*/
    db.transaction(function(tr){

        tr.executeSql(sqlQuery, sql, function(tx, rs){
            const Content = $('#Content');

            //沒有資料
            if(rs.rows.length <= 0){
                Content.addClass('h-100');
                Content.html(
                    '<div class="row align-items-center h-100 g-0 text-center">' +
                    '   <div class="col-12" style="color: var(--text-gary);">' +
                    '       <img src="../../img/lost-cago.svg" alt="沒有資料" height="80rem">' +
                    '       <div class="pt-2">沒有資料... （；´д｀）ゞ</div>' +
                    '   </div>' +
                    '</div>');
                $('#Item-Total > div:nth-child(n+1) > span, #Month-Total').text('0.0')
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
                $('#Item-Total > div:nth-child(5) > span').text(formatPrice(Month_Total.toFixed(Setting["Decimal_places"])));
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