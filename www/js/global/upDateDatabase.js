/*
 * Copyright (c) 2021. By Cocomine
 */
'use strict'

console.log('DatabaseVer_Helper loaded!')
let DatabaseVer_Helper = {
    checkUpdate: function(){
        db.transaction(function(tr){
            tr.executeSql("SELECT value FROM Setting WHERE Target = 'database_version'", [], function(tx, rs){
                switch(rs.rows.item(0).value){
                    case '1.0':
                        DatabaseVer_Helper.doUpdate.To_1_2();
                        break;
                    case '1.2':
                        DatabaseVer_Helper.doUpdate.To_1_3();
                        break;
                    case '1.3':
                        DatabaseVer_Helper.doUpdate.To_1_3_1();
                        break;
                    case '1.3.1':
                        DatabaseVer_Helper.doUpdate.To_1_4();
                        break;
                    case '1.4':
                        DatabaseVer_Helper.doUpdate.To_1_4_1();
                        break;
                    case '1.4.1':
                        DatabaseVer_Helper.doUpdate.To_1_5();
                        break;
                    default:
                        console.log('DatabaseVer_Helper:', '已是最新')
                        break;
                }
            }, function(e){
                console.log('DatabaseVer_Helper:', '檢查資料庫發現錯誤', e.message);
                DatabaseVer_Helper.startUp();//初始化資料庫
            }, function(){
                console.log('DatabaseVer_Helper:', '檢查資料庫完成');
            });
        });
    },
    doUpdate: {
        To_1_2: function(){
            db.transaction(function(tr){
                tr.executeSql("INSERT INTO Setting (Target, value) VALUES ('Decimal_places', '2')", []);
                tr.executeSql("DELETE FROM Setting WHERE Target = 'google-access-token'", []);
                tr.executeSql("UPDATE Setting SET value = '1.2' WHERE Target = 'database_version'", []);
            }, function(e){
                console.log('DatabaseVer_Helper:', '資料庫更新失敗', e.message);
            }, function(){
                console.log('DatabaseVer_Helper:', '資料庫已更新至1.2');
                location.reload();
            });
        },
        To_1_3: function(){
            db.transaction(function(tr){
                tr.executeSql("CREATE TABLE Note ( `ID` INTEGER NOT NULL, `DateTime` DATETIME NOT NULL , `Top` BOOLEAN NOT NULL DEFAULT FALSE, `Color` VARCHAR(9) NOT NULL ,`Title` VARCHAR(20) NULL , `Contact` VARCHAR(200) NULL , PRIMARY KEY (`ID`))");
                tr.executeSql("CREATE INDEX Note_DateTime ON Note(`DateTime`)");
                tr.executeSql("CREATE VIEW Top_Note AS SELECT * FROM Note WHERE Top IS TRUE");
                tr.executeSql("UPDATE Setting SET value = '1.3' WHERE Target = 'database_version'", []);
            }, function(e){
                console.log('DatabaseVer_Helper:', '資料庫更新失敗', e.message);
            }, function(){
                console.log('DatabaseVer_Helper:', '資料庫已更新至1.3');
                location.reload();
            });
        },
        To_1_3_1: function(){
            db.transaction(function(tr){
                tr.executeSql("CREATE TABLE new_Note ( `ID` INTEGER NOT NULL, `DateTime` DATETIME NOT NULL , `Top` BOOLEAN NOT NULL DEFAULT FALSE, `Color` VARCHAR(9) NOT NULL ,`Title` VARCHAR(20) NULL , `Contact` VARCHAR(200) NULL , PRIMARY KEY (`ID`))");
                tr.executeSql("DROP TABLE Note");
                tr.executeSql("DROP VIEW Top_Note");
                tr.executeSql("ALTER TABLE new_Note RENAME TO Note");
                tr.executeSql("CREATE VIEW Top_Note AS SELECT * FROM Note WHERE Top IS TRUE");
                tr.executeSql("UPDATE Setting SET value = '1.3.1' WHERE Target = 'database_version'", []);
            }, function(e){
                console.log('DatabaseVer_Helper:', '資料庫更新失敗', e.message);
            }, function(){
                console.log('DatabaseVer_Helper:', '資料庫已更新至1.3.1');
                location.reload();
            });
        },
        To_1_4: function(){
            db.transaction(function(tr){
                tr.executeSql("INSERT INTO Setting (Target, value) VALUES ('Email-to', 'mail@example.com')", []);
                tr.executeSql("ALTER TABLE Record ADD COLUMN Remake VARCHAR(50) DEFAULT NULL");
                tr.executeSql("UPDATE Setting SET value = '1.4' WHERE Target = 'database_version'", []);
            }, function(e){
                console.log('DatabaseVer_Helper:', '資料庫更新失敗', e.message);
            }, function(){
                console.log('DatabaseVer_Helper:', '資料庫已更新至1.4');
                location.reload();
            });
        },
        To_1_4_1: function(){
            db.transaction(function(tr){
                tr.executeSql("ALTER TABLE Record RENAME COLUMN Remake TO Remark");
                tr.executeSql("UPDATE Setting SET value = '1.4.1' WHERE Target = 'database_version'", []);
            }, function(e){
                console.log('DatabaseVer_Helper:', '資料庫更新失敗', e.message);
            }, function(){
                console.log('DatabaseVer_Helper:', '資料庫已更新至1.4');
                location.reload();
            });
        },
        To_1_5: function(){
            db.transaction(function(tr){
                tr.executeSql("INSERT INTO Setting (Target, value) VALUES ('AutoBackup', 'Off')", []); //放入sql
                tr.executeSql("INSERT INTO Setting (Target, value) VALUES ('AutoBackup_cycle', 'Day')", []); //放入sql
                tr.executeSql("UPDATE Setting SET value = '1.5' WHERE Target = 'database_version'", []);
            }, function(e){
                console.log('DatabaseVer_Helper:', '資料庫更新失敗', e.message);
            }, function(){
                console.log('DatabaseVer_Helper:', '資料庫已更新至1.5');
                location.reload();
            });
        }
    },
    startUp: function(){
        /* 初始化資料庫*/
        db.transaction(function(tr){
            //創建紀錄table
            tr.executeSql("CREATE TABLE Record ( `RecordID` INTEGER NOT NULL , `DateTime` DATETIME NOT NULL, `OrderNum` CHAR(9) NOT NULL , `Type` CHAR(2) NOT NULL , `CargoNum` CHAR(11) NOT NULL , `Local` VARCHAR(50) NOT NULL , `RMB` DOUBLE NOT NULL DEFAULT '0' , `HKD` DOUBLE NOT NULL DEFAULT '0' , `Add` DOUBLE NOT NULL DEFAULT '0' , `Shipping` DOUBLE NOT NULL DEFAULT '0' , `Remark` VARCHAR(50) DEFAULT NULL, PRIMARY KEY (`RecordID`))");
            tr.executeSql("CREATE INDEX `DateTime` ON Record (`DateTime`)");
            //創建備忘錄table
            tr.executeSql("CREATE TABLE Note ( `ID` INTEGER NOT NULL, `DateTime` DATETIME NOT NULL , `Top` BOOLEAN NOT NULL DEFAULT FALSE, `Color` VARCHAR(9) NOT NULL ,`Title` VARCHAR(20) NULL , `Contact` VARCHAR(200) NULL , PRIMARY KEY (`ID`))");
            tr.executeSql("CREATE INDEX Note_DateTime ON Note(`DateTime`)");
            tr.executeSql("CREATE VIEW Top_Note AS SELECT * FROM Note WHERE Top IS TRUE");
            //創建設定table
            tr.executeSql("CREATE TABLE Setting (Target VARCHAR(50) PRIMARY KEY, value VARCHAR(100))");
            //資料庫填充
            tr.executeSql("INSERT INTO Setting (Target, value) VALUES ('Rate', '0.836')", []); //放入sql
            tr.executeSql("INSERT INTO Setting (Target, value) VALUES ('company-name-ZH', '公司名稱')", []); //放入sql
            tr.executeSql("INSERT INTO Setting (Target, value) VALUES ('company-name-EN', 'Company Name')", []); //放入sql
            tr.executeSql("INSERT INTO Setting (Target, value) VALUES ('Driver-name', '陳大明')", []); //放入sql
            tr.executeSql("INSERT INTO Setting (Target, value) VALUES ('Driver-license', 'RT XXXX')", []); //放入sql
            tr.executeSql("INSERT INTO Setting (Target, value) VALUES ('database_version', '1.5')", []); //放入sql
            tr.executeSql("INSERT INTO Setting (Target, value) VALUES ('Email-to', 'mail@example.com')", []);
            tr.executeSql("INSERT INTO Setting (Target, value) VALUES ('Decimal_places', '2')", []);
            tr.executeSql("INSERT INTO Setting (Target, value) VALUES ('AutoBackup', 'Off')", []); //放入sql
            tr.executeSql("INSERT INTO Setting (Target, value) VALUES ('AutoBackup_cycle', 'day')", []); //放入sql

        }, function(error){
            console.log('傳輸錯誤: ' + error.message);
        }, function(){
            console.log('已初始化資料庫');
            location.reload();
        });
    }
}