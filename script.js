(function(){

	var stamp_mode;
	var delete_mode;
	var current_sheet;
	var file_ids_list;

	/**
	 * 土台の準備.
	 */
	function setup(){
		stamp_mode = false;
		delete_mode = false;

		insertStampModeButton();
		insertStampTool();
		insertStampTab();
		insertStampMenuPopup();

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
		return '/gateway.php?cmd=preview_file&bin=1&file_id=' + file_id;
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

		var menu = document.createElement('span');
		menu.setAttribute('id','stampSheetMenuBtn');
		menu.setAttribute('role','button');
		menu.setAttribute('class','_showDescription icoFontActionMore');
		menu.setAttribute('aria-label','シートメニュー');

		var stamp_tab = document.createElement('div');
		stamp_tab.setAttribute('id','stampTab');
		stamp_tab.appendChild(btn);
		stamp_tab.appendChild(menu);

		var stamp_tool = document.getElementById('stampTool');
		stamp_tool.appendChild(stamp_tab);
	}

	/**
	 * シートメニューを追加
	 */
	function insertStampMenuPopup(){
		// import用ファイル選択ダイアログ
		var ifile = document.createElement('input');
		ifile.setAttribute('type','file');
		ifile.setAttribute('id','stampFileImporter');
		ifile.setAttribute('multiple','multiple');
		ifile.style.display = 'none';
		ifile.onchange = importSheet;
		document.body.appendChild(ifile);

		// export用ダウンロードリンク
		var efile = document.createElement('a');
		efile.setAttribute('id','stampFileExporter');
		efile.setAttribute('target','_blank');
		efile.style.display = 'none';
		document.body.appendChild(efile);

		var ul = document.createElement('ul');
		ul.setAttribute('role','menu');
		ul.setAttribute('class','_cwDDListBody cwNoWrap ddListBody');

		var li;
		li = document.createElement('li');
		li.innerHTML = '<span class="icon icoFontActionDelete"></span> 削除モード';
		li.setAttribute('role','menuitem');
		li.setAttribute('class','_cwDDList');
		li.onclick = toggleDeleteMode;
		ul.appendChild(li);

		li = document.createElement('li');
		li.innerHTML = '<span class="icon icoFontContentClose"></span> インポート';
		li.setAttribute('role','menuitem');
		li.setAttribute('class','_cwDDList');
		li.onclick = function(){ ifile.click(); };
		ul.appendChild(li);

		li = document.createElement('li');
		li.innerHTML = '<span class="icon icoFontContentOpen"></span> エクスポート';
		li.setAttribute('role','menuitem');
		li.setAttribute('class','_cwDDList');
		li.onclick = exportSheet;
		ul.appendChild(li);

		var i = document.createElement('input');
		i.setAttribute('id','stampSheetFileInput')
		i.setAttribute('type','file');
		i.style.display = 'none';

		var triangle = document.createElement('div');
		triangle.setAttribute('class','_cwTTTriangle toolTipTriangle toolTipTriangleWhiteBottom');

		var popup = document.createElement('div');
		popup.setAttribute('id','stampSheetMenuPopup');
		popup.setAttribute('class','toolTip toolTipWhite mainContetTooltip')
		popup.setAttribute('role','tooltip');
		popup.appendChild(triangle);
		popup.appendChild(ul);
		document.body.appendChild(popup);

		triangle.style.left = popup.clientWidth/2 - triangle.offsetWidth/2 - 1 + 'px';
		popup.style.display = 'none';
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
		sheet.style.maxHeight = '350px';
		sheet.style.overflow = 'auto';

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
		if(!delete_mode){
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
		if(delete_mode){
			toggleDeleteMode();
		}
		CW.view.resizeLayout();
	}

	/**
	 * シートメーニューのトグル.
	 * 開いている時メニューの外を押したら閉じるようにしている.
	 */
	window.addEventListener(
		'click',
		function(e){
			var pp = document.getElementById('stampSheetMenuPopup');
			var src = e.srcElement;
			if(src.id=='stampSheetMenuBtn' && pp.style.display=='none'){
				pp.style.display = '';
				var rect = src.getBoundingClientRect();
				pp.style.left = (rect.left + rect.right)/2 - (pp.offsetWidth/2)  + "px";
				rect = src.parentElement.getBoundingClientRect();
				pp.style.top = rect.top - pp.offsetHeight + "px";
			}
			else{
				pp.style.display = 'none';
			}
		},
		false
	);

	/**
	 * 削除モードトグル.
	 */
	function toggleDeleteMode(){
		delete_mode = !delete_mode;
		var tool = document.getElementById('stampTool');
		if(delete_mode){
			tool.setAttribute('class','deleteMode');
		}
		else{
			tool.setAttribute('class','');
		}
	}

	/**
	 * シートのエクスポート.
	 */
	function exportSheet(){
		var data = JSON.stringify(file_ids_list[current_sheet]);
		var blob = new Blob([data],{type:'x-application/json+fileidlist'});
		window.webkitRequestFileSystem(TEMPORARY,blob.size,function(fs){
			fs.root.getFile(
				'stampsheet'+current_sheet+'.json',
				{create:true,exclusive:false,type:'application/json'},
				function(file){
					file.createWriter(function(fw){
						fw.write(blob);
						fw.onwriteend = function(e){
							var a = document.getElementById('stampFileExporter');
							a.setAttribute('href',file.toURL());
							a.click();
						};
					});
				});
		});
	}

	/**
	 * シートのインポート
	 */
	function importSheet(e){
		var onload = function(e){
			var list = JSON.parse(e.target.result);
			if(Array.isArray(list) && list.length>0){
				insertStampSheet(file_ids_list.length, list);
				file_ids_list.push(list);
				saveFileIdList(file_ids_list);
			}
		}
		var files = e.target.files;
		for(var i=0;i<files.length;++i){
			var reader = new FileReader;
			reader.onload = onload;
			reader.readAsText(files[i])
		}
	}

	/* ---------------------------------------- */

	setup();

})();

