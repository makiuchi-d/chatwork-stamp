(function(){

	var stamp_mode;
	var edit_mode;
	var current_sheet;
	var file_ids_list;

	/**
	 * 土台の準備.
	 */
	function setup(){
		stamp_mode = false;
		edit_mode = false;

		insertStampModeButton();
		insertStampTool();
		insertStampTab();

		file_ids_list = loadFileIdList();
		current_sheet = -1;

		for(var i=0;i<file_ids_list.length;++i){
			if(insertStampSheet(i,file_ids_list[i])){
				current_sheet = 0; // 1つでもシートが作れたら0番を選択
			}
		}

		switchStampSheet(current_sheet);
	}

	/**
	 * 表示するファイルのURL.
	 */
	function stampImgUrl(file_id){
		return 'https://kcw.kddi.ne.jp/gateway.php?cmd=preview_file&bin=1&file_id=' + file_id;
	}

	/**
	 * 投稿するスタンプタグのフォーマット.
	 */
	function stampTag(file_id){
		return '[preview id=' + file_id + ' ht=100]';
	}

	/**
	 * localstrageからファイルIDリストを取り出す.
	 * 空のものは省く.
	 */
	function loadFileIdList(){
		var list = [];
		var item = localStorage.getItem('CWStamp_idList');
		if(item){
			list = JSON.parse(item);
			for(var i=list.length-1;i>=0;--i){
				if(list[i].length==0){
					list.splice(i,1);
				}
			}
		}
		return list;
	}

	/**
	 * localstrageへファイルIDリストを保存.
	 */
	function saveFileIdList(list){
		var item = JSON.stringify(list);
		localStorage.setItem('CWStamp_idList',item);
	}

	/**
	 * スタンプモードボタン追加.
	 */
	function insertStampModeButton()
	{
		var btn = document.createElement('span');
		btn.setAttribute('class', 'icoSizeLarge icoFontInfo');
		btn.addEventListener('click',function(){toggleStampMode();},false);
		var li = document.createElement('li');
		li.setAttribute('id', 'stampModeButton');
		li.setAttribute('role', 'button');
		li.setAttribute('class', '_showDescription');
		li.setAttribute('aria-label', 'スタンプ');
		li.appendChild(btn);
		document.getElementById('_chatSendTool').appendChild(li);
	}

	/**
	 * スタンプツール領域.
	 */
	function insertStampTool(){
		var stamp_tool = document.createElement('div');
		stamp_tool.setAttribute('id','stampTool');
		stamp_tool.style.display = 'none';
		document.getElementById('_chatTextArea').appendChild(stamp_tool);
	}

	/**
	 * スタンプタブ.
	 */
	function insertStampTab(){
		var btn = document.createElement('span');
		btn.setAttribute('id','stampNewSheetBtn');
		btn.setAttribute('role','button');
		btn.setAttribute('class','_showDescription icoFontAddBtn');
		btn.setAttribute('aria-label','新しいシート');
		btn.onclick = function(){
			switchStampSheet(-1);
		}

		var edit = document.createElement('span');
		edit.setAttribute('id','stampSheetEditBtn');
		edit.setAttribute('role','button');
		edit.setAttribute('class','_showDescription icoFontSetting');
		edit.setAttribute('aria-label','シート編集');
		edit.onclick = toggleEditMode;

		var stamp_tab = document.createElement('div');
		stamp_tab.setAttribute('id','stampTab');
		stamp_tab.appendChild(btn);
		stamp_tab.appendChild(edit);

		var stamp_tool = document.getElementById('stampTool');
		stamp_tool.appendChild(stamp_tab);
	}

	/**
	 * タブにアイテムを追加.
	 */
	function insertTabItem(num,file_id){
		var img = document.createElement('img');
		img.setAttribute('id','stampTabItem'+num);
		img.setAttribute('src',stampImgUrl(file_id));
		img.setAttribute('data-stamp-sheet-num',num);
		img.onclick = clickTabItem;

		var btn = document.getElementById('stampNewSheetBtn');
		var stamp_tab = document.getElementById('stampTab');
		stamp_tab.insertBefore(img,btn);
	}

	/**
	 * タブアイテムをクリックでシート切り替え.
	 */
	function clickTabItem(){
		var num = this.getAttribute('data-stamp-sheet-num');
		if(num){
			switchStampSheet(num);
		}
	}

	/**
	 * スタンプシート.
	 */
	function insertStampSheet(num,file_ids){
		if(file_ids.length==0){
			return false;
		}

		var sheet = document.createElement('div');
		sheet.setAttribute('id','stampSheet'+num);
		sheet.setAttribute('class','stampSheet');
		sheet.setAttribute('data-stamp-sheet-num',num);
		sheet.style.display = 'none';

		for(var i=0;i<file_ids.length;++i){
			var btn = createStampButtonElement(file_ids[i]);
			sheet.appendChild(btn);
		}

		insertTabItem(num,file_ids[0]);

		var stamp_tab = document.getElementById('stampTab');
		var stamp_tool = document.getElementById('stampTool');
		stamp_tool.insertBefore(sheet,stamp_tab);

		return true;
	}

	/**
	 * スタンプシートの切り替え.
	 */
	function switchStampSheet(num){
		var sheet = document.getElementById('stampSheet'+current_sheet);
		if(sheet){
			sheet.style.display = 'none';
		}
		var tab = document.getElementById('stampTabItem'+current_sheet);
		if(tab){
			tab.setAttribute('class','');
		}

		current_sheet = num;
		sheet = document.getElementById('stampSheet'+current_sheet);
		if(sheet){
			sheet.style.display = '';
		}
		tab = document.getElementById('stampTabItem'+current_sheet);
		if(tab){
			tab.setAttribute('class','active');
		}
		CW.view.resizeLayout();
	}

	/**
	 * スタンプボタン生成.
	 */
	function createStampButtonElement(file_id){
		var img = document.createElement('img');
		img.setAttribute('src', stampImgUrl(file_id));
		img.setAttribute('alt','stamp image '+file_id);

		var ico = document.createElement('span');
		ico.setAttribute('class','icon iconSizeLarge icoFontActionDelete');

		var btn = document.createElement('span');
		btn.setAttribute('class','stampButton');
		btn.setAttribute('data-file-id',file_id);
		btn.onclick = onStampButton;
		btn.appendChild(img);
		btn.appendChild(ico);

		return btn;
	}

	/**
	 * スタンプボタンの挙動.
	 *  - 通常: スタンプ投稿
	 *  - 編集時: スタンプをシートから削除
	 */
	function onStampButton(){
		if(!edit_mode){
			postStamp(this);
			toggleStampMode();
		}
		else{
			removeStamp(this);
		}
	}

	/**
	 * スタンプ投稿実行
	 */
	function postStamp(btn){
		var chat_text = document.getElementById('_chatText');
		var tmp = chat_text.value;

		chat_text.value = stampTag(btn.getAttribute('data-file-id'));

		var click = document.createEvent('MouseEvents');
		click.initEvent('click',false,true);
		document.getElementById('_sendButton').dispatchEvent(click);

		chat_text.value = tmp;
	}

	/**
	 * スタンプ削除.
	 */
	function removeStamp(btn){
		var sheet = btn.parentNode.getAttribute('data-stamp-sheet-num');
		var index = 0;
		var t = btn;
		while(t=t.previousSibling){
			++index;
		}
		btn.parentNode.removeChild(btn);
		file_ids_list[sheet].splice(index,1);
		saveFileIdList(file_ids_list);
	}

	/**
	 * スタンプ追加ボタン.
	 * ファイル一覧のリストを生成するメソッドをフックしてボタンを埋め込む.
	 */
	var FL_view_getFilePanel = FL.view.getFilePanel;
	FL.view.getFilePanel = function(a,b){
		var html = FL_view_getFilePanel(a,b);
		if(html.search('class="fileIconArea ico35Image"')>=0){
			html = html.replace(
				'<div class="fileBtnArea btnGroup">',
				'<div class="fileBtnArea btnGroup">'
					+ '<div class="_showDescription button" aria-label="スタンプリストに追加" data-add-stamp-file-id="'+a.id+'">'
					+ '<span class="icoFontAddBtn" data-add-stamp-file-id="'+a.id+'">'
					+ '</span></div>');
		}
		return html;
	}

	/**
	 * 埋め込んだスタンプ追加ボタンが押された時の処理.
	 */
	window.addEventListener(
		'click',
		function(e){
			var file_id = e.srcElement.getAttribute('data-add-stamp-file-id');
			if(file_id){
				addStamp(file_id);
			}
		},
		false
	);

	/**
	 * スタンプをシートに追加.
	 */
	function addStamp(file_id){
		var sheet = document.getElementById('stampSheet'+current_sheet);
		if(sheet){
			file_ids_list[current_sheet].push(file_id);
			var btn = createStampButtonElement(file_id);
			sheet.appendChild(btn);
		}
		else{
			var num = file_ids_list.length;
			file_ids_list.push([file_id]);
			insertStampSheet(num,[file_id]);
			switchStampSheet(num);
		}
		saveFileIdList(file_ids_list);
		CW.view.resizeLayout();
	}

	/**
	 * スタンプモードのトグル.
	 */
	function toggleStampMode(){
		stamp_mode = !stamp_mode;
		var stamp_tool = document.getElementById('stampTool');
		var chat_text = document.getElementById('_chatText');
		if(stamp_mode){
			stamp_tool.style.display = '';
			chat_text.style.display = 'none';
		}
		else{
			stamp_tool.style.display = 'none';
			chat_text.style.display = '';
		}
		if(edit_mode){
			toggleEditMode();
		}
		CW.view.resizeLayout();
	}

	/**
	 * 編集モードトグル.
	 */
	function toggleEditMode(){
		edit_mode = !edit_mode;
		var tool = document.getElementById('stampTool');
		if(edit_mode){
			tool.setAttribute('class','editMode');
		}
		else{
			tool.setAttribute('class','');
		}
	}

	/* ---------------------------------------- */

	setup();

})();

