$(document).ready(function () {
    let words = ["censorship.", "corruption.", "discrimination."];
    let index = 0;
    let word = words[index];
    let charIndex = 0;

    $(window).on("scroll", function () {
        var scrollTop = $(window).scrollTop();
        var scaleValue = 1 - scrollTop / ($(window).height() * 0.5);
        scaleValue = Math.max(0, Math.min(1, scaleValue));

        var styleElem = document.head.appendChild(document.createElement("style"));
        styleElem.innerHTML = ".uncensored-text::before { transform: scaleX(" + scaleValue + "); }";
    });

    function type() {
        if (charIndex < word.length) {
            $(".typed-text").append(word[charIndex]);
            charIndex++;
            setTimeout(type, 100);
        } else {
            setTimeout(erase, 1500);
        }
    }

    function erase() {
        if (charIndex > 0) {
            $(".typed-text").html(word.substring(0, charIndex - 1));
            charIndex--;
            setTimeout(erase, 100);
        } else {
            index = (index + 1) % words.length;
            word = words[index];
            setTimeout(type, 500);
        }
    }
    
    $("#reviewButton").click(function () {
        $("#reviewPopup").modal("show");
    });

    $("#searchStaffInput").on("input", function () {
        var searchQuery = $(this).val();
        if (searchQuery.length > 2) {
            $.post("/search_staff", { search_query: searchQuery })
                .done(function (data) {
                var staffListHTML = "";
                data.forEach(function (staff) {
                    var ratingColor = "red";
                    var avg_rating = staff.avg_rating ? staff.avg_rating.toFixed(1) : "N/A";

                    if (staff.avg_rating >= 7) {
                        ratingColor = "green";
                    } else if (staff.avg_rating >= 5) {
                        ratingColor = "yellow";
                    }
                    staffListHTML += '<a href="#" class="list-group-item list-group-item-action" data-email="' + staff.email + '" data-name="' + staff.name + '"><strong>' + staff.name + '</strong><br><small>' + staff.email + '</small><br><span class="font-weight-bold" style="color: ' + ratingColor + ';">Rating: ' + avg_rating + '</span></a>';
                });
                $("#staffList").html(staffListHTML);
            });
        } else {
            $("#staffList").html("");
        }
    });

    $("#staffList").on("click", ".list-group-item", function () {
        var selectedStaffEmail = $(this).data("email");
        var selectedStaffName = $(this).data("name");
        var avgRating = $(this).find(".font-weight-bold").text();
        var ratingColor = "red";
        if (parseFloat(avgRating.split(" ")[1]) >= 7) {
            ratingColor = "green";
        } else if (parseFloat(avgRating.split(" ")[1]) >= 5) {
            ratingColor = "yellow";
        }
        $("#selectedStaffAvgRating").text(avgRating).removeClass("red yellow green").addClass(ratingColor);
        $("#selectedStaffEmail").text(selectedStaffEmail).attr("href", "mailto:" + selectedStaffEmail);
        $("#selectedStaffName").text(selectedStaffName).data("email", selectedStaffEmail);
        $("#searchStaffSection").hide();
        $("#reviewSection").show();
        loadReviews(selectedStaffEmail);
        return false; // Added this line to prevent the default behavior of the click event
    });

    $("#submitReviewButton").click(function () {
        var studentEmail = $("#studentEmailInput").val();
        var staffEmail = $("#selectedStaffName").data("email");
        var reviewText = $("#reviewText").val();
        var rating = $("#ratingInput").val();
        if (!rating || rating < 1 || rating > 10) {
            alert("Error: Please enter a valid rating between 1 and 10.");
            return;
        }
        $.post("/submit_review", {
            student_email: studentEmail,
            staff_email: staffEmail,
            review_text: reviewText,
            rating: rating
        })
            .done(function () {
                alert("Review submitted successfully!");
                loadReviews(selectedStaffEmail);
            })
            .fail(function (error) {
                alert(error.responseText);
            });
    });

    $("#backButton").click(function () {
        $("#searchStaffSection").show();
        $("#reviewSection").hide();
    });

    function loadReviews(staffEmail) {
        $.post("/load_reviews", {staff_email: staffEmail})
            .done(function (reviews) {
                var reviewListHTML = "";
                reviews.forEach(function (review) {
                    var ratingColor = "red";
                    if (review.rating >= 7) {
                        ratingColor = "green";
                    } else if (review.rating >= 5) {
                        ratingColor = "yellow";
                    }
                    reviewListHTML += '<div class="review-list-item"><span class="rating ' + ratingColor + '">' + review.rating.toFixed(1) + '</span><br><span>' + review.review_text + '</span></div><hr>';
                });
                $("#reviewList").html(reviewListHTML);
                $("#reviewList").scrollTop(0);
            });
    }

    type();
});