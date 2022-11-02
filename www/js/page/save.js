/*
 * Copyright (c) 2022. By Cocomine
 */
'use strict'
$('.scrollbar-inner').scrollbar();

document.addEventListener('deviceready', function(){
    $(document).on("backbutton", function(){
        navigator.app.exitApp();
    }); //後退按鈕

    /* 打開資料庫 */
    let click;
    let long_click;
    $('div[data-save]').click((e) => {
        console.log("click")
        if(click){
            clearTimeout(click);
            click = null; //clear Timer
        }
        click = setTimeout(function(){
            console.log("click work")
            const save = $(e.currentTarget).data('save');
            localStorage.setItem("openDB", "eveApp" + (save === 0 ? "" : save) + ".db")

            //set name
            if(dbname[save] === null){
                dbname[save] = "未命名";
                localStorage.setItem("DBname", JSON.stringify(dbname))
            }

            window.location.replace("/index.html") //open
        }, 300)
    })

        /* 更改名稱 */
        .dblclick((e) => {
        clearTimeout(click);
        click = null; //clear Timer

        const save = $(e.currentTarget).data('save');
        navigator.notification.prompt(
            "請輸入名稱",
            function(results){
                if(results.buttonIndex === 1){
                    if(/\S+/g.test(results.input1)){
                        //更新
                        dbname[save] = results.input1;
                        localStorage.setItem("DBname", JSON.stringify(dbname))
                        window.location.reload();
                    }else{
                        window.plugins.toast.showShortBottom("輸入格式不正確");
                    }
                }
            },
            '存檔名稱',
            ['確認', '取消'],
            dbname[save]
        );
    })

        /* 刪除 */
        .on("touchstart", function(e){
        const save = $(e.currentTarget).data('save');
        if(long_click){
            clearTimeout(long_click);
            long_click = null; //clear Timer
        }
        long_click = setTimeout(function(){
            navigator.notification.confirm(
                "確認刪除?",
                function(results){
                    if(results === 1){
                        //檔案不存在
                        if(dbname[save] === null){
                            window.plugins.toast.showShortBottom("該位置沒有存檔");
                            return;
                        }
                        const path = cordova.file.applicationStorageDirectory + "databases/eveApp" + (save === 0 ? "" : save) + ".db"
                        window.resolveLocalFileSystemURL(path, function(file){
                            file.remove(function(){ //刪除
                                //刪除名稱
                                dbname[save] = null;
                                localStorage.setItem("DBname", JSON.stringify(dbname))

                                window.plugins.toast.showShortBottom("成功刪除");
                                window.location.reload();
                            }, function(){
                                window.plugins.toast.showShortBottom("刪除失敗");
                            })
                        });
                    }
                },
                '刪除',
                ['確認', '取消']
            );
        }, 1000);
    }).on('touchend touchmove', function(e){
        clearTimeout(long_click);
        long_click = null; //clear Timer
    })
});

/* 名稱不存在 */
(function(){
    if(localStorage.getItem("DBname") == null){
        localStorage.setItem("DBname", JSON.stringify(["未命名", null, null, null, null, null, null, null, null, null]))
    }
})();

/* 讀取名稱 */
const dbname = JSON.parse(localStorage.getItem("DBname"));
for(let i = 0 ; i < 10 ; i++){
    if(dbname[i] === null) continue;
    $(`div[data-save=${i}] > span`).text(dbname[i])
}