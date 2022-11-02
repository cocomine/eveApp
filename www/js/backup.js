/*
 * Copyright (c) 2021. By Cocomine
 */
'use strict';
document.addEventListener('deviceready', function(){
    let Setting;

    /* 載入設定 */
    $(document).on('onSettingLoad', function(e, Setting1){
        Setting = Setting1;
        if(Setting['AutoBackup'] === 'On'){
            $('#AutoBackup-switch').prop('checked', true);
        }
        $(`[name="AutoBackup"][value="${Setting['AutoBackup_cycle']}"]`).prop('checked', true);
    });

    const backupList = $('#backupList');
    const backup_list_Modal = new bootstrap.Modal(backupList);
    let accessToken, folderID, PackageName, SHA1;
    const mime = 'application/x-sqlite3';
    const DBName = localStorage.getItem('openDB') || 'eveApp.db';
    const path = cordova.file.applicationStorageDirectory + 'databases/' + DBName; //application/x-sqlite3
    //console.log(mime, name, path); //debug

    //Get SHA1 & PackageName
    cordova.getSignatureFingerprint.getSignature(function(sha1){
        SHA1 = sha1.replaceAll(':', '');
        //console.log(SHA1);
    });
    cordova.getSignatureFingerprint.getPackageName(function(name){
        PackageName = name;
        //console.log(PackageName)
    });

    //Auto login google
    window.plugins.googleplus.trySilentLogin({
        'scopes': 'https://www.googleapis.com/auth/drive.file profile',
        'webClientId': '', //ClientId(Web)
        'offline': false,
        'webApiKey': '' //ApiKey(Web)
    }, function(obj){
        console.log(obj); //debug
        accessToken = obj.accessToken;
        listAllBackup(function(){
            check_AutoBackup();
        });
        $('#Connect').hide();
        $('#Connected').show();
        $('#Logout-google').show();
        $('#AutoBackup').show();
        $('#User-detail>div:nth-child(8)').text(obj.email);
    }, function(msg){
        console.log(msg); //debug
        if(msg === 4){
            SpinnerDialog.hide();
            window.plugins.toast.showShortBottom('存取已過期, 請重新連接');
        }
    });

    //login google
    $('#Login-Google').click(function(){
        window.plugins.googleplus.login(
            {
                'scopes': 'https://www.googleapis.com/auth/drive.file profile',
                'webClientId': '', //ClientId(Web)
                'offline': true,
                'webApiKey': '' //ApiKey(Web)
            },
            function(obj){
                console.log(obj); //debug
                accessToken = obj.accessToken;
                listAllBackup();

                $('#Connect').hide();
                $('#Connected').show();
                $('#Logout-google').show();
                $('#User-detail>div:nth-child(8)').text(obj.email);
            },
            function(msg){
                window.plugins.toast.showShortBottom('登入失敗');
                console.log('登入失敗: ' + msg);
            }
        );
    });

    //logout google
    $('#Logout-google').click(disconnect);

    //Backup
    $('#Backup').click(Backup);

    /* Recover */
    $('#Recover').click(function(){
        backup_list_Modal.show(this);
    });
    //打印所有檔案
    backupList.on('show.bs.modal', function(event){
        listAllBackup(function(data){
            let html = '';
            for(const file of data.files){
                //console.log(file) //debug
                html += `<a class="list-group-item list-group-item" data-file-id="${file.id}">${file.name}</a>`;
            }
            $(event.target.querySelector('.list-group')).html(html);
        });
    });
    //下載選擇的備份檔案
    backupList.on('click', '.list-group > a[data-file-id]', function(){

        const fileID = $(this).attr('data-file-id');
        SpinnerDialog.show(null, '恢復中, 請稍等...', true);
        backup_list_Modal.hide(); //hideModal

        download_file(fileID, accessToken, PackageName, SHA1, function(data){
            console.log(typeof data); //debug
            db.close(function(){
                window.resolveLocalFileSystemURL(path, function(file){
                    file.createWriter(function(fileWriter){

                        fileWriter.onwriteend = function(){
                            openDB();
                            console.log('恢復成功');
                            SpinnerDialog.hide();
                            window.plugins.toast.showShortBottom('恢復成功');
                        };
                        fileWriter.onerror = function(e){
                            SpinnerDialog.hide();
                            window.plugins.toast.showShortBottom('恢復失敗');
                            console.log('恢復失敗: ' + e.toString());
                        };
                        fileWriter.write(data);

                    });
                }, function(error){
                    console.info('FileSystem Error : ', error);
                });
            });
        }, function(xhr, textStatus){
            SpinnerDialog.hide();
            if(textStatus === 'timeout') window.plugins.toast.showShortBottom('恢復失敗');
            $('#Recover').prop('disabled', false);
            if(textStatus === 'error' && xhr.status === '404') listAllBackup();
            if(textStatus === 'error' && xhr.status === '401') disconnect();
        });
    });

    //列出所有備份
    function listAllBackup(callback = () => null){
        list_files('name = \'eveApp\' and mimeType = \'application/vnd.google-apps.folder\'', accessToken, PackageName, SHA1, function(data){
            //console.log(data); //debug
            if(data.files.length <= 0){
                upload_file(
                    'application/vnd.google-apps.folder', 'eveApp', 'eveApp Database folder.', accessToken, PackageName, SHA1, null, null,
                    function(data){
                        //console.log(data); //debug
                        folderID = data.id;
                        callback(data);
                    }
                );
            }else{
                folderID = data['files'][0]['id'];
                list_files(`parents = '${data['files'][0]['id']}'`, accessToken, PackageName, SHA1, function(data){
                    //console.log(data); //debug
                    callback(data);
                    const CreateTime = data['files'][0]['name'].match(/[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}-[0-9]{1,2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}/g);
                    $('#User-detail>div:nth-child(2)').text(CreateTime[0]);
                });
            }
        }, function(xhr, textStatus){
            SpinnerDialog.hide();
            if(textStatus === 'timeout') window.plugins.toast.showShortBottom('連接超時');
            if(textStatus === 'error' && xhr.status === '404') listAllBackup();
            if(textStatus === 'error' && xhr.status === '401') disconnect();
        });
    }

    //Backup
    function Backup(){
        SpinnerDialog.show(null, '備份中, 請稍等...', true);
        db.close(function(){
            window.resolveLocalFileSystemURL(path, function(file){
                //console.log(file); //debug
                file.file(function(file){
                    //console.log(file); //debug
                    let reader = new FileReader();

                    reader.onloadend = function(){
                        const FileName = DBName.split('.');
                        upload_file(
                            mime, FileName[0] + moment(new Date).format('_D/M/YYYY-H:mm:ss.SSS.') + FileName[1],
                            'eveApp Database. Backup on ' + moment(new Date).format('DD/M/YYY HH:mm:ss'), accessToken, PackageName, SHA1, [folderID],
                            this, function(){
                                //console.log(data); //debug
                                openDB();
                                window.plugins.toast.showShortBottom('備份完成');
                                SpinnerDialog.hide();
                                listAllBackup();
                                const auto_back_path = sessionStorage.getItem('Auto_Back');
                                localStorage.setItem('Last_Backup', new Date().toISOString());
                                if(auto_back_path){
                                    location.replace(auto_back_path);
                                    sessionStorage.removeItem('Auto_Back');
                                }
                            }, function(xhr, textStatus){
                                openDB();
                                SpinnerDialog.hide();
                                if(textStatus === 'timeout') window.plugins.toast.showShortBottom('連接超時備份失敗');
                                if(textStatus === 'error' && xhr.status === '404') listAllBackup();
                                if(textStatus === 'error' && xhr.status === '401') disconnect();
                            }
                        );
                        //console.log(this.result); //debug
                    };

                    reader.readAsArrayBuffer(file);
                }, function(error){
                    console.info('FileReader Error : ', error);
                });
            }, function(error){
                console.info('FileSystem Error : ', error);
            });
        });
    }

    /* AutoBackup Setting*/
    //switch
    $('#AutoBackup-switch').change(function(){
        const checked = this.checked ? 'On' : 'Off';

        db.transaction(function(tr){
            tr.executeSql('UPDATE Setting SET value = ? WHERE Target = \'AutoBackup\'', [checked]);
        }, function(e){
            console.log('自動備份更新失敗', e.message);
        }, function(){
            console.log('自動備份更新成功');
        });
    });
    //cycle
    $('[name="AutoBackup"]').change(function(){
        const value = this.value;

        db.transaction(function(tr){
            tr.executeSql('UPDATE Setting SET value = ? WHERE Target = \'AutoBackup_cycle\'', [value]);
        }, function(e){
            console.log('自動備份週期更新失敗', e.message);
        }, function(){
            console.log('自動備份週期更新成功');
        });
    });

    //check AutoBackup
    function check_AutoBackup(){
        let Last_Backup = localStorage.getItem('Last_Backup');
        if(Last_Backup && Setting['AutoBackup'] === 'On'){
            const now = new Date();
            Last_Backup = new Date(Last_Backup);

            let diff = now.getTime() - Last_Backup.getTime();
            //console.log( Setting['AutoBackup_cycle'], diff);
            if(Setting['AutoBackup_cycle'] === 'Day' && diff >= (1000 * 60 * 60 * 24)) Backup();
            if(Setting['AutoBackup_cycle'] === 'Week' && diff >= (1000 * 60 * 60 * 24 * 7)) Backup();
            if(Setting['AutoBackup_cycle'] === 'Month' && diff >= (1000 * 60 * 60 * 24 * 30)) Backup();
        }
    }
});

/**
 * 斷開連接
 */
function disconnect(){
    window.plugins.googleplus.logout();
    $('#Connect').show();
    $('#Connected').hide();
    $('#Logout-google').hide();
    $('#AutoBackup').hide();
    $('#User-detail>div:nth-child(8)').text('');
}

/**
 * 列出所有檔案
 * @param filter 過濾條件
 * @param accessToken 授權令牌
 * @param PackageName 軟件包名稱
 * @param SHA1 軟件包SHA1
 * @param callback 成功
 * @param errorCallBack 失敗
 */
function list_files(filter, accessToken, PackageName, SHA1, callback, errorCallBack){
    $.ajax({
        url: 'https://www.googleapis.com/drive/v3/files',
        type: 'GET',
        data: {
            q: filter,
            key: '',
            orderBy: 'createdTime desc'
        },
        headers: {
            Authorization: 'Bearer ' + accessToken,
            'X-Android-Package': PackageName,
            'X-Android-Cert': SHA1
        },
        success: function(data){
            callback(data);
        },
        error: function(xhr, textStatus){
            errorCallBack(xhr, textStatus);
        }
    });
}

/**
 * 上傳檔案
 * @param mimeType 檔案類型
 * @param name 檔案名稱
 * @param description 檔案描述
 * @param accessToken 授權令牌
 * @param PackageName 軟件包名稱
 * @param SHA1 軟件包SHA1
 * @param parents 上一級資料夾(if)
 * @param File_reader 檔案(if)
 * @param callback 成功
 * @param errorCallBack 失敗
 */
function upload_file(mimeType, name, description, accessToken, PackageName, SHA1, parents = null, File_reader = null, callback, errorCallBack){
    let formData = new FormData();
    //設定中繼資料
    const Metadata_json = {
        'mimeType': mimeType,
        'name': name,
        'description': description
    };
    if(parents !== null) Metadata_json['parents'] = parents;
    const Metadata = new Blob([JSON.stringify(Metadata_json)], {
        type: 'application/json; charset=UTF-8'
    });
    formData.append('Metadata', Metadata);

    //設定檔案
    if(File_reader !== null){
        const data = new Blob([File_reader.result], {
            type: mimeType
        });
        formData.append('File', data);
    }

    //上載
    $.ajax({
        url: 'https://www.googleapis.com/upload/drive/v3/files/?uploadType=multipart&key=',
        type: 'POST',
        data: formData,
        headers: {
            Authorization: 'Bearer ' + accessToken,
            'X-Android-Package': PackageName,
            'X-Android-Cert': SHA1
        },
        contentType: false,
        processData: false,
        success: function(data){
            callback(data);
        },
        error: function(xhr, textStatus){
            errorCallBack(xhr, textStatus);
        }
    });
}

/**
 * 下載檔案
 * @param fileID 遠端檔案id
 * @param accessToken 授權令牌
 * @param PackageName 軟件包名稱
 * @param SHA1 軟件包SHA1
 * @param callback 成功
 * @param errorCallBack 失敗
 */
function download_file(fileID, accessToken, PackageName, SHA1, callback, errorCallBack){
    $.ajax({
        url: 'https://www.googleapis.com/drive/v3/files/' + fileID,
        type: 'GET',
        data: {
            key: '',
            alt: 'media'
        },
        headers: {
            Authorization: 'Bearer ' + accessToken,
            'X-Android-Package': PackageName,
            'X-Android-Cert': SHA1
        },
        xhr: function(){
            let xhr = new XMLHttpRequest();
            xhr.dataType = 'binary';
            xhr.responseType = 'arraybuffer';
            return xhr;
        },
        success: function(data){
            callback(data);
        },
        error: function(xhr, textStatus){
            errorCallBack(xhr, textStatus);
        }
    });
}