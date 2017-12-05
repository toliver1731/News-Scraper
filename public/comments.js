$(document).ready(function(){
    //TODO: add a loading message that disappears when articles arrive
    $.getJSON("/api/comments", function(data) {
        for (var i = 0; i < data.length; i++) {
            var comment = $('<div>').addClass("comment").attr("comment-id", data[i]._id);
            comment.append($("<p>").addClass("comment-name").text(data[i].user+" said: "));
            comment.append($("<p>").addClass("comment-text").text(data[i].textContent));
            comment.append($("<a>").addClass("comment-article").attr("href", data[i].article.url).text("...about " + data[i].article.headline));
            

            $("#comments").append(comment);
        }
    });

})