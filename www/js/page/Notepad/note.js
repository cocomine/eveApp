/*
 * Copyright (c) 2021. By Cocomine
 */
'use strict';
(function(){
    /* 設定聽textarea高度 */
    set_content_input_height();
    $(window).on('resize', set_content_input_height);

    function set_content_input_height(){
        const content_input = $('.content-input');
        content_input.height($('#note-form').height() - content_input[0].offsetTop);
    }

    const today = new Date();
    $("#note-date").val(today.toISOString().substr(0, 10)); //設定今日日期

    /* 返回備忘錄 */
    $('a[href="index.html"]').click(function(e){
        e.preventDefault();
        save();//儲存
    })
})();

const NoteID = window.location.hash.substring(1); //取得備忘錄id

//顏色選擇
$(".note-colo-sel-opt").click(function(e){
    const last_color = $(".active");
    const select_color = $(this);
    const content = $("#note-content");
    content.removeClass(last_color.data('bg'));
    last_color.removeClass("active");
    select_color.addClass("active");
    content.addClass(select_color.data('bg'));
})

//置頂
$('#Set-pin').click(function(){
    const pin = $(this);
    if(pin.data('pin') === 0){
        pin.removeClass('bi-pin');
        pin.addClass('bi-pin-fill');
        pin.data("pin", 1);
    }else{
        pin.removeClass('bi-pin-fill');
        pin.addClass('bi-pin');
        pin.data("pin", 0);
    }
    console.log(pin.data('pin'));
})

document.addEventListener('deviceready', function(){

    //後退按鈕
    $(document).on("backbutton", save);//儲存

    //刪除備忘錄
    $('#Delete').click(function(e){
        db.transaction(function(tr){
            tr.executeSql("DELETE FROM Note WHERE Note.ID = ?", [NoteID])
        }, function(e){
            console.log('傳輸錯誤: ' + error.message);
        }, function(){
            console.log('備忘錄已刪除');
            window.plugins.toast.showShortBottom("備忘錄已刪除");
            JumpPage('index.html', 'right');
        })
    })

    if(NoteID.length <= 0){
        $("#Delete").remove();//如果沒有即增加
    }else{
        db.transaction(function(tr){
            //編輯備忘錄
            tr.executeSql("SELECT * FROM Note WHERE ID = ?", [NoteID], function(rx, rs){
                const row = rs.rows.item(0);
                //放上資料
                $('#note-date').val(row.DateTime);
                $('#note-title').val(row.Title);
                $('#note-content').val(row.Contact).addClass(row.Color);
                $(".active").removeClass("active")
                $(`[data-bg='${row.Color}']`).addClass('active');
                if(row.Top === 1){
                    $('#Set-pin').data('pin', 1).removeClass('bi-pin').addClass("bi-pin-fill");
                }
            });
        }, function(error){
            console.log('傳輸錯誤: ' + error.message);
        }, function(){
            console.log('已取得資料');
        });
    }
});

/* 儲存 */
function save(){
    const date = $('#note-date').val();
    const title = $('#note-title').val();
    const content = $('#note-content').val();
    const color = $(".active").data('bg');
    const top = $('#Set-pin').data('pin');


    db.transaction(function(tr){
        if(NoteID === ''){
            //增加備忘錄
            tr.executeSql("INSERT INTO Note (DateTime, Top, Color, Title, Contact) VALUES (?,?,?,?,?)", [date, top, color, title, content]);
        }else{
            //修改備忘錄
            tr.executeSql("UPDATE Note SET DateTime = ?, Top = ?, Color = ?, Title = ?, Contact = ? WHERE ID = ?", [date, top, color, title, content, NoteID]);
        }
    }, function(e){
        console.log('傳輸錯誤: ' + e.message);
    }, function(){
        window.plugins.toast.showShortBottom("備忘錄已儲存");
        sessionStorage.setItem('ShowDay', date.toString());
        JumpPage('index.html', 'right');
    });
}