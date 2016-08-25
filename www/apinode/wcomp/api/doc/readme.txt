接受參數：	
	doc:
		為必要，格式請參考coimotion的api文件格式

	word：
		api文件顯示時，所需要使用的文字，建議給予。格式為物件，共有下列幾項屬性
		id, query, out, errorCode, seeAlso, parameter, required, description, property, code
		ex: {
				query: "輸入參數",
				out: "回傳值"
			}

	titleColor:
		標題顏色，格式為字串，ex: "#ff0000"

	descColor:
		描述文句顏色，格式同上

	tableStyle:
		參考bootstrap tables的css，以字串陣列的方式傳入，ex: ["table-bordered", "table-hover"]

事件：
	當點選了see also的其中一個端點後，會呼叫onChangeDoc，其附帶的值為完整的api路徑
