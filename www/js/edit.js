/*
 * Copyright (c) 2021. By Cocomine
 */
'use strict';
(function(){

    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms = document.querySelectorAll('.needs-validation');

    // Loop over them and prevent submission
    Array.prototype.slice.call(forms).forEach(function(form){
        form.addEventListener('submit', function(event){
            if(!form.checkValidity()){
                event.preventDefault()
                event.stopPropagation()
            }

            form.classList.add('was-validated')
        }, false)
    });

})();
$('.scrollbar-inner').scrollbar();
const dropDown = new bootstrap.Dropdown($('#Local'));

/* 返回主頁 */
$('a[href="index.html"]').click(function(e){
    e.preventDefault();
    GoBackHome();
})

/* 計算折算 */
let Rates = null; //匯率變數
$('#RMB').on('input change', function(){
    const val = $(this).val();
    $('label[for="RMB"]:last-child').text('折算 HK$ ' + (val / Rates).toFixed(2));
});

/* 計算合計 */
$("#RMB, #Add, #HKD, #Shipping").on('input change', function(){
    const RMB = parseInt($('#RMB').val()) || 0;
    const HKD = parseInt($('#HKD').val()) || 0;
    const Add = parseInt($('#Add').val()) || 0;
    const Shipping = parseInt($('#Shipping').val()) || 0;

    const Total = ((HKD + Add + Shipping) + (RMB / Rates)).toFixed(2);
    //console.log(Total);
    $('#Total').text('HK$ ' + Total);
})

/* 自動換欄 自動完成*/
$("#OrderNum, #Type, #CargoLetter, #CargoNum, #CargoCheckNum").on('input change', function(e){
    const val = $(this).val();
    //console.log(this.id, val.length) //debug
    if(this.id === 'OrderNum'){
        if(val.length >= 9) $('#Type').focus();
        if(/^[0-9]{2}$/g.test(val)) $(this).val(val + '/');
        if(/^[0-9]{2}\/[0-9]{2}$/g.test(val)) $(this).val(val + '/');
        if(/^[0-9]{2}\/[0-9]{2}\/$/g.test(val)) $(this).val(val.substr(0, 5));
        if(/^[0-9]{2}\/$/g.test(val)) $(this).val(val.substr(0, 2));
    }
    if(this.id === 'Type'){
        if(val.length >= 2) $('#CargoLetter').focus();
    }
    if(this.id === 'CargoLetter'){
        $(this).val(val.toUpperCase());
        if(val.length >= 4) $('#CargoNum').focus();
    }
    if(this.id === 'CargoNum'){
        if(val.length >= 6) $('#CargoCheckNum').focus();
    }
    if(this.id === 'CargoCheckNum'){
        if(val.length >= 1) $('#Local').focus();
    }
});

/* auto fill */
$("#Local-auto").on("click", ".dropdown-item", function(e){
    let val = $(this).data("value");
    $("#Local").val(val);
})

document.addEventListener('deviceready', function(){
    $(document).on("backbutton", function(){
        GoBackHome();
    }); //後退按鈕

    /* 載入匯率 */
    db.transaction(function(tr){
        tr.executeSql("SELECT value FROM Setting WHERE Target = 'Rate'", [], function(tx, rs){
            console.log('匯率: ' + rs.rows.item(0).value); //debug
            Rates = parseFloat(rs.rows.item(0).value);
            $('#Rates').text(`匯率: 1 港幣 = ${Rates} 人民幣`);
        }, function(error){
            console.log('獲取匯率失敗: ' + error.message); //debug
        });
    }, function(error){
        console.log('傳輸錯誤: ' + error.message); //debug
    });

    /* 表單提交修改數據庫 */
    $('#edit-form').submit(function(e){
        if(!e.isDefaultPrevented()){
            e.preventDefault();
            e.stopPropagation();
            const formData = new FormData(this);

            const [RMB, HKD, Add, Shipping] = [parseFloat(formData.get('RMB') || 0), parseFloat(formData.get('HKD') || 0), parseFloat(formData.get('Add') || 0), parseFloat(formData.get('Shipping') || 0)];
            const CargoNum = formData.get('CargoLetter') + formData.get('CargoNum') + formData.get('CargoCheckNum');

            if(CargoNumCheck(formData.get('CargoLetter'), formData.get('CargoNum'), formData.get('CargoCheckNum'))){ //檢查櫃號
                //通過修改資料庫
                db.transaction(function(tr){
                    tr.executeSql("UPDATE Record SET `DateTime` = ?, OrderNum = ?, Type = ?, CargoNum = ?, Local = ?, RMB = ?, HKD = ?, `Add` = ?, Shipping = ?, Remark = ? WHERE RecordID = ?",
                        [formData.get('DateTime'), formData.get('OrderNum'), formData.get('Type'), CargoNum, formData.get('Local'), RMB, HKD, Add, Shipping, formData.get('Remark'), formData.get('RecordID')]);
                }, function(error){
                    console.log('傳輸錯誤: ' + error.message); //debug
                }, function(){
                    window.plugins.toast.showShortBottom("紀錄已修改");
                    sessionStorage.setItem('ShowDay', formData.get('DateTime').toString());
                    window.history.back();
                });
            }else{
                //不通過彈出提醒
                $("#CargoLetter, #CargoNum, #CargoCheckNum").addClass('is-invalid');
                window.plugins.toast.showLongBottom("貨櫃號校驗失敗! 請檢查輸入是否正確");
            }
        }
    });

    /* auto complete */
    $('#Local').on('input focus', function(e){
        const word = $(this).val();
        //check database
        db.transaction(function(tr){
            tr.executeSql("SELECT DISTINCT Local FROM Record WHERE Local LIKE ? LIMIT 10", ["%" + word + "%"], function(tx, rs){
                const Local_auto = $("#Local-auto");
                Local_auto.html("");
                if(rs.rows.length <= 0){
                    dropDown.hide();
                    return;
                }
                for(let i = 0 ; i < rs.rows.length ; i++){
                    let val = rs.rows.item(i).Local

                    //插入
                    let index = val.search(new RegExp(word, 'i'))
                    let display_name = val.substring(0, index) + "<span style='color: var(--primary-color)'>";
                    display_name += val.substring(index, index + word.length) + "</span>";
                    display_name += val.substring(index + word.length);

                    Local_auto.append(`<li><a class="dropdown-item" data-value="${val}">${display_name}</a></li>`);
                }
                dropDown.show();
            })
        }, function(error){
            console.log('傳輸錯誤: ' + error.message); //debug
        });
    });

    /* Copy to add page */
    $('#Copy').click(function(e){
        e.preventDefault()
        const formData = new FormData(document.querySelector('#edit-form'));

        let obj = {}
        formData.forEach(function(value, key){
            obj[key] = value;
        })
        //console.log(obj); //debug
        //console.log(JSON.stringify(obj));

        localStorage.setItem('Draft', JSON.stringify(obj));
        JumpPage('add.html', "up", 300)
    });

    /* 表單提交刪除數據庫 */
    $('#Delete').click(function(e){
        e.preventDefault()
        const formData = new FormData($('#edit-form')[0]);
        //刪除資料
        db.transaction(function(tr){
            tr.executeSql("DELETE FROM Record WHERE RecordID = ?", [formData.get('RecordID')]);
        }, function(error){
            console.log('傳輸錯誤: ' + error.message); //debug
        }, function(){
            window.plugins.toast.showShortBottom("紀錄已刪除");
            window.history.back();
        });
    });

    /* 提取紀錄 */
    const RecordID = window.location.hash.substring(1);
    if(RecordID.length > 0){
        db.transaction(function(tr){
            console.log("顯示: ", RecordID); //debug
            tr.executeSql("SELECT * FROM Record WHERE RecordID = ?", [RecordID], function(tx, rs){
                const row = rs.rows.item(0);
                //console.log(row); //debug
                $('#DateTime').val(row.DateTime);
                $('#OrderNum').val(row.OrderNum);
                $('#Type').val(row.Type);
                $('label[for="Type"]:last-child').text(row.Type);
                $('#CargoLetter').val(row.CargoNum.toString().substr(0, 4));
                $('#CargoNum').val(row.CargoNum.toString().substr(4, 6));
                $('#CargoCheckNum').val(row.CargoNum.toString().substr(10));
                $('#Local').val(row.Local);
                $('#RMB').val(row.RMB);
                $('label[for="RMB"]:last-child').text('折算 HK$ ' + (row.RMB / Rates).toFixed(2));
                $('#HKD').val(row.HKD);
                $('#Add').val(row.Add);
                $('#Shipping').val(row.Shipping);
                $('#Total').text('HK$ ' + ((row.HKD + row.Add + row.Shipping) + (row.RMB / Rates)).toFixed(2));
                $('#RecordID').val(row.RecordID);
                $('#Remark').val(row.Remark);
            }, function(tx, error){
                console.log('取得資料錯誤: ' + error.message);
            });
        }, function(error){
            console.log('傳輸錯誤: ' + error.message);
        }, function(){
            console.log('已取得資料');
        });
    }else{
        window.plugins.toast.showShortBottom("沒有指定紀錄ID");
        window.history.back();
    }
});

/* 檢查櫃號檢查櫃號 */
function CargoNumCheck(CargoLetter, CargoNum, CargoCheckNum){
    //分拆字元
    CargoLetter = CargoLetter.split("");
    CargoNum = CargoNum.split("");

    //英文轉換數字
    for(let i = 0 ; i < CargoLetter.length ; i++){
        CargoLetter[i] = (function(){
            if(CargoLetter[i] === "A"){
                return 10;
            }else{
                const [LetterList, LetterList2, LetterList3] = ["BCDEFGHIJK", "LMNOPQRSTU", "VWXYZ"];
                let index = LetterList.indexOf(CargoLetter[i]);
                if(index < 0){
                    index = LetterList2.indexOf(CargoLetter[i]);
                    if(index < 0){
                        index = LetterList3.indexOf(CargoLetter[i]);
                        return 34 + index
                    }
                    return 23 + index;
                }
                return 12 + index;
            }
        })();
    }

    //字串轉換數字
    CargoCheckNum = parseInt(CargoCheckNum)
    for(let i = 0 ; i < CargoNum.length ; i++){
        CargoNum[i] = parseInt(CargoNum[i]);
    }

    //console.log(CargoNum, CargoLetter)

    //進行計算
    let CargoLetterTotal = CargoLetter[0] * 1 + CargoLetter[1] * 2 + CargoLetter[2] * 4 + CargoLetter[3] * 8;
    //console.log("CargoLetterTotal", CargoLetterTotal)
    let CargoNumTotal = CargoNum[0] * 16 + CargoNum[1] * 32 + CargoNum[2] * 64 + CargoNum[3] * 128 + CargoNum[4] * 256 + CargoNum[5] * 512;
    //console.log("CargoNumTotal", CargoNumTotal)
    //console.log("Total", (CargoLetterTotal+CargoNumTotal))
    let Test = ((CargoLetterTotal + CargoNumTotal) % 11) % 10;
    //console.log("End", Test)
    return Test === CargoCheckNum;
}