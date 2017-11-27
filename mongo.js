const mongojs = require('mongojs')


var db = mongojs('news', ['headlines']);

db.headlines.insert({
	worked: true
});

db.headlines.find({}, (err, docs) => {
	if (err) {
		console.log(err);
		db.close();
		return;
	}
	console.log(docs);
	db.close();
});
