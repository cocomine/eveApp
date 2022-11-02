/*
 * Copyright (c) 2022. By Cocomine
 */

let AutoBackup = {
    checkBackup: function(){
        if(location.pathname !== '/backup.html'){
            $(document).on('onSettingLoad', function(e, Setting){
                if(Setting['AutoBackup'] === 'On'){
                    let Last_Backup = localStorage.getItem('Last_Backup')
                    if(Last_Backup){
                        const now = new Date()
                        Last_Backup = new Date(Last_Backup);

                        let diff = now.getTime() - Last_Backup.getTime()
                        if(Setting['AutoBackup_cycle'] === 'Day' && diff >= (1000 * 60 * 60 * 24)) jump();
                        if(Setting['AutoBackup_cycle'] === 'Week' && diff >= (1000 * 60 * 60 * 24 * 7)) jump();
                        if(Setting['AutoBackup_cycle'] === 'Month' && diff >= (1000 * 60 * 60 * 24 * 30)) jump();
                    }
                }

                function jump(){
                    SpinnerDialog.show(null, '自動備份中, 請稍等...', true);
                    sessionStorage.setItem('Auto_Back', location.pathname);
                    location.replace('/backup.html');
                }
            });
        }
    }
}