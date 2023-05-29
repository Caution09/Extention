// 使い方がよくわからないので後回し

// // 変数宣言
// let clientId = "166377723388-gqsso58ok0k9psa9ebg02cj57e01cqmc.apps.googleusercontent.com";
// let redirectUri = "urn:ietf:wg:oauth:2.0:oob";
// let scope = "https://www.googleapis.com/auth/drive.readonly";
// let authUrl = "https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=" + clientId + "&redirect_uri=" + redirectUri + "&scope=" + scope;
// let code;

// // 認証リクエスト用 URL を開く
// window.open(authUrl);

// // ユーザーがコードを入力して送信するまで待機する
// // 例えば、モーダルダイアログを表示して、ユーザーにコードの入力を促すことができる
// function waitForCode() {
//   if (code) {
//     // アクセストークン取得用のリクエストを送信する
//     let xhr = new XMLHttpRequest();
//     xhr.open("POST", "https://oauth2.googleapis.com/token", true);
//     xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
//     xhr.onreadystatechange = function() {
//       if (xhr.readyState === 4 && xhr.status === 200) {
//         let response = JSON.parse(xhr.responseText);
//         let accessToken = response.access_token;
//         // 取得したアクセストークンを使用してAPIリクエストを送信する
//         // ...
//       }
//     };
//     xhr.send("code=" + code + "&client_id=" + clientId + "&client_secret=クライアントシークレット&redirect_uri=" + redirectUri + "&grant_type=authorization_code");
//   } else {
//     setTimeout(waitForCode, 1000);
//   }
// }
// waitForCode();

// // ユーザーがコードを入力して送信したときに、この関数を呼び出す
// function setCode(inputCode) {
//   code = inputCode;
// }



// // 変数宣言
// let xhr = new XMLHttpRequest();
// let url = "https://www.googleapis.com/drive/v3/files/?orderBy=folder,name&q='ID' in parents and trashed=false";
// let accessToken = "アクセストークン";

// // 1. マイドライブの「無題のフォルダー」からフォルダー / ファイルの一覧を取得する（絞り込み：フォルダ ID 且つ ゴミ箱以外にあるファイル(フォルダ)）
// xhr.open("GET", url, true);
// xhr.setRequestHeader("Authorization", "Bearer " + accessToken);
// xhr.onreadystatechange = function() {
//   if (xhr.readyState === 4 && xhr.status === 200) {
//     let response = JSON.parse(xhr.responseText);
//     let files = response.files;
//     let fileCount = files.length;
    
//     // 2. ファイル(フォルダ)情報を取得する
//     for (let i = 0; i < fileCount; i++) {
//       let file = files[i];
//       let id = file.id;
//       let name = file.name;
//       let mimeType = file.mimeType;
//       let kinds = mimeType === "application/vnd.google-apps.folder" ? "フォルダー" : "ファイル";
      
//       // テーブルにデータを挿入する
//       let row = dw_1.InsertRow(0);
//       row.SetItem(0, kinds);
//       row.SetItem(1, name);
//       row.SetItem(2, id);
//     }
    
//     // メッセージ
//     MessageBox("完了", "フォルダー/ファイルの一覧取得に成功しました");
//   }
// };
// xhr.send();
