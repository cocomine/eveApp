/*
 * Copyright (c) 2021. By Cocomine
 */

$('.scrollbar-inner').scrollbar();
let ShowDay = new Date();
if(sessionStorage.getItem("ShowDay") !== null){
    ShowDay = new Date(sessionStorage.getItem("ShowDay"));
    sessionStorage.removeItem("ShowDay");
}

const NoteID = window.location.hash.substring(1); //取得備忘錄id

/* 選擇顯示月份 */
function NextMonth(){
    ShowDay.setMonth(ShowDay.getMonth() + 1)
    print_Note();
}

function LastMonth(){
    ShowDay.setMonth(ShowDay.getMonth() - 1);
    print_Note();
}

$('#Last-month').on("click", LastMonth);
$('#Next-month').on("click", NextMonth);

/* 編輯備忘錄 */
$(document).on('click', '.card', function(e){
    const card = $(this);
    JumpPage('note.html#' + card.data('note-id'));
})

/* 返回備忘錄 */
$('a[href="./index.html"]').click(function(e){
    e.preventDefault();
    GoBackHome();//儲存
})

document.addEventListener('deviceready', function(){
    //後退按鈕
    $(document).on("backbutton", GoBackHome);
    $('a[href="index.html"]').click(GoBackHome);

    /* 顯示當前月份 */
    $('#month').text(moment(ShowDay).format('M月 YYYY'))

    print_Note();//打印備忘錄
});

/* 打印備忘錄 */
function print_Note(){
    /* 取得當月備忘錄*/
    db.transaction(function(tr){
        console.log("顯示: ", moment(ShowDay).format("MM"), moment(ShowDay).format("YYYY"));
        tr.executeSql("SELECT * FROM Note WHERE STRFTIME('%m', DateTime) = ? AND STRFTIME('%Y', DateTime) = ? AND Top IS FALSE ORDER BY DateTime DESC", [moment(ShowDay).format("MM"), moment(ShowDay).format("YYYY")], function(tx, rs){
            const Content = $('#Content');
            $('#month').text(moment(ShowDay).format('M月 YYYY'))

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
                getTopNote(true);//取得置頂備忘錄
                return;
            }

            //有資料
            const package_list = package_HTML(rs);//打包資料
            const Grouping_list = Grouping_HTML(package_list);//資料分組
            Content.html('');//清除畫面
            Content.removeClass('h-100');//移除強制高度
            Convert_to_HTML(Grouping_list, function(html){//打印畫面
                Content.append(html);//分段打印
            }, function(){
                /*完成打印 後執行*/

                getTopNote();//取得置頂備忘錄
                /* 如果帶有# */
                if(NoteID !== ''){
                    const x = $("[data-note-id='" + NoteID + "']");
                    const offsetTop = x[0].offsetTop;
                    $('.scrollbar-inner').scrollTop(offsetTop);
                    x.fadeOut(300).fadeIn(300).fadeOut(300).fadeIn(300);
                    return;
                }

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

        //放入html
        const html = `
                <div class="note-body card ${row.Color}" data-note-id="${row.ID}">
                    <div class="note-body card-title">${row.Title}</div>
                    <div class="card-text">${row.Contact}</div>
                </div>`

        //放入資料
        const package_item = {
            'DateTime': row.DateTime,
            'html': html
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
function Convert_to_HTML(Grouping_list, html_output, Ends){
    for(let i = 0 ; i < Grouping_list.length ; i++){
        /* head */
        let body = '';
        const Date = moment(Grouping_list[i][0]['DateTime']).locale('zh-hk');

        /* body */
        for(let n = 0 ; n < Grouping_list[i].length ; n++){
            body += Grouping_list[i][n]['html'];
        }

        //放入html
        const html = `<div class="col-12 note-part" data-day="${Date.format('DD')}">
                <div class="note-head">${Date.format('D.M (dddd)')}</div>` + body + '</div>';

        html_output(html) //callback html
    }

    Ends(); //當運行完結時callback
}

/* 取得置頂備忘錄 */
function getTopNote(Content_isEmpty = false){
    db.transaction(function(tr){
        console.log("取得置頂備忘錄");
        tr.executeSql("SELECT * FROM Top_Note ORDER BY DateTime", [], function(tx, rs){
            if(rs.rows.length <= 0) return;
            const Content = $('#Content');

            let body = '<div class="col-12 note-part">';
            for(let i = 0 ; i < rs.rows.length ; i++){
                const row = rs.rows.item(i);

                body += `
                    <div class="note-body card ${row.Color}" data-note-id="${row.NoteID}">
                        <div class="note-body card-title"><i class="bi bi-pin"></i> ${row.Title}</div>
                        <div class="card-text">${row.Contact}</div>
                    </div>`
            }
            body += '</div>';

            if(!Content_isEmpty){
                Content.prepend(body);
            }else{
                Content.removeClass('h-100');//移除強制高度
                Content.html(body);
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