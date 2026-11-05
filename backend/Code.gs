/**
 * バイブスインターンLP 集計用スクリプト（Google Apps Script）
 *
 * このスクリプトを「集計用スプレッドシート」の拡張機能 > Apps Script に貼り付けて使います。
 * 2つのことを自動でやります。
 *   1. LPの「無料で相談してみる」ボタンが押されたら、シート「LPクリック」に1行追加
 *   2. 竹内さんのカレンダーから、LP用の予約スケジュールで入った予約を拾い、シート「予約一覧」に記録
 *      （予約が入った直後に自動実行＋保険で5分ごと。キャンセルされた予約は「状態」を「キャンセル」に更新）
 *
 * 手順は「セットアップ手順.md」を参照してください。
 */

const CONFIG = {
  // 竹内さんのカレンダーID（通常は竹内さんのメールアドレス）
  CALENDAR_ID: 'TODO: takeuchi@yaruka-yaranka.co.jp のように書き換える',
  // 予約スケジュールの「タイトル」と同じ文字列。予約が入ると、カレンダーの予定名にこの文字が入る
  SCHEDULE_TITLE: 'バイブスインターン 無料相談',
  SHEET_BOOKINGS: '予約一覧',
  SHEET_CLICKS: 'LPクリック',
  LOOKBACK_DAYS: 14,  // 何日前に作られた予約まで遡って確認するか
  LOOKAHEAD_DAYS: 120, // 何日先の面談まで確認するか
};

const BOOKING_HEADER = ['予定ID', '予約を受けた日時', '面談日時', '名前', 'メールアドレス', '状態', '予約時の入力内容'];
const CLICK_HEADER = ['日時', 'ボタンの場所', '端末', 'ページ', '流入元', 'utm_source', 'utm_medium', 'utm_campaign'];
const POSITION_LABEL = { header: 'ヘッダー', fv: 'ファーストビュー', sticky: '追従ボタン（まずは話を聞いてみる）', cta: 'ページ最下部' };

/** シートを取得（なければ見出し付きで作る） */
function getSheet_(name, header) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(header);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, header.length).setFontWeight('bold');
  }
  return sh;
}

/** 1. LPからのクリック記録を受け取る（ウェブアプリとして公開して使う） */
function doPost(e) {
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    getSheet_(CONFIG.SHEET_CLICKS, CLICK_HEADER).appendRow([
      new Date(),
      POSITION_LABEL[d.position] || String(d.position || ''),
      String(d.device || ''),
      String(d.page || ''),
      String(d.referrer || ''),
      String(d.utm_source || ''),
      String(d.utm_medium || ''),
      String(d.utm_campaign || ''),
    ]);
  } catch (err) {
    console.error(err);
  }
  return ContentService.createTextOutput('ok');
}

/** 空白（半角・全角）を無視して比べるための整形 */
function norm_(s) {
  return String(s || '').replace(/[\s　]/g, '');
}

/** 予約スケジュール経由の予定かどうか */
function isBooking_(ev) {
  return norm_(ev.getTitle()).indexOf(norm_(CONFIG.SCHEDULE_TITLE)) !== -1;
}

/** 2. カレンダーからLP経由の予約を拾ってシートに記録する（予約直後のトリガー＋5分ごとの保険で実行） */
function syncBookings() {
  const cal = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
  if (!cal) throw new Error('カレンダーが見つかりません。CONFIG.CALENDAR_ID と、カレンダーの共有設定を確認してください。');

  const sh = getSheet_(CONFIG.SHEET_BOOKINGS, BOOKING_HEADER);
  const now = new Date();
  const start = new Date(now.getTime() - CONFIG.LOOKBACK_DAYS * 86400000);
  const end = new Date(now.getTime() + CONFIG.LOOKAHEAD_DAYS * 86400000);

  // すでに記録済みの予定ID
  const lastRow = sh.getLastRow();
  const rows = lastRow > 1 ? sh.getRange(2, 1, lastRow - 1, BOOKING_HEADER.length).getValues() : [];
  const known = new Set(rows.map((r) => r[0]));

  // 新しい予約を追加
  const events = cal.getEvents(start, end).filter(isBooking_);
  events.forEach((ev) => {
    const id = ev.getId();
    if (known.has(id)) return;
    const guests = ev.getGuestList().map((g) => g.getEmail()).filter((m) => m && m !== CONFIG.CALENDAR_ID);
    // 予定名は「<予約スケジュールのタイトル> (予約者の名前)」の形になるので、最後のカッコ内を名前とする
    const m = ev.getTitle().match(/[（(]([^（()）]*)[）)]\s*$/);
    const name = m ? m[1].trim() : '';
    sh.appendRow([id, ev.getDateCreated(), ev.getStartTime(), name, guests.join(', '), '予約中', ev.getDescription()]);
  });

  // キャンセルされた予約（カレンダーから消えた予定）の状態を更新
  rows.forEach((r, i) => {
    const [id, , startTime, , , status] = r;
    if (status !== '予約中' || !(startTime instanceof Date) || startTime < now) return;
    if (!cal.getEventById(id)) sh.getRange(i + 2, 6).setValue('キャンセル');
  });
}

/** 確認用：直近の予定の中身をログに出す（予約一覧に入らないときの原因調査用。何も書き換えない） */
function debugListEvents() {
  const cal = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
  if (!cal) { console.log('カレンダーが見つかりません: ' + CONFIG.CALENDAR_ID); return; }
  const now = new Date();
  const events = cal.getEvents(new Date(now.getTime() - 7 * 86400000), new Date(now.getTime() + 60 * 86400000));
  console.log('対象カレンダー: ' + CONFIG.CALENDAR_ID + ' ／ 探している文字: 「' + CONFIG.SCHEDULE_TITLE + '」 ／ 予定の数: ' + events.length);
  events.slice(0, 30).forEach((ev, i) => {
    console.log([
      '#' + (i + 1),
      '予定名: 「' + ev.getTitle() + '」',
      '一致: ' + (isBooking_(ev) ? 'する' : 'しない'),
      '日時: ' + ev.getStartTime(),
      '作成: ' + ev.getDateCreated(),
      'ゲスト: ' + ev.getGuestList().map((g) => g.getEmail()).join(', '),
      '説明(先頭200字): ' + String(ev.getDescription() || '').slice(0, 200).replace(/\n/g, ' / '),
    ].join(' ｜ '));
  });
  const triggers = ScriptApp.getProjectTriggers().filter((t) => t.getHandlerFunction() === 'syncBookings');
  console.log('自動実行の設定: ' + (triggers.length
    ? triggers.map((t) => String(t.getEventType())).join(' と ')
    : 'なし（setupTrigger を実行してください）'));
}

/**
 * 初回だけ手動で実行：自動実行（トリガー）を登録する
 *   ・カレンダー更新トリガー … 予約が入った／キャンセルされた直後（数秒〜1分）に転記（メイン）
 *   ・5分ごとの定期チェック … 上のトリガーが動かなかった場合の保険
 * 何度実行しても、古いトリガーを消してから登録し直すので重複しません。
 */
function setupTrigger() {
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === 'syncBookings')
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('syncBookings').forUserCalendar(CONFIG.CALENDAR_ID).onEventUpdated().create();
  ScriptApp.newTrigger('syncBookings').timeBased().everyMinutes(5).create();
  getSheet_(CONFIG.SHEET_BOOKINGS, BOOKING_HEADER);
  getSheet_(CONFIG.SHEET_CLICKS, CLICK_HEADER);
  syncBookings();
}
