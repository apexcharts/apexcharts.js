
function responsiveSidebar() {
  if($(window).width() > 767) {
    $('.sidebar-menu-btn').hide(0);
    $('.sidebar-close-btn').hide(0);
  }
  else {
    if($('.sidebar-responsive').hasClass('active')) {
      $('.sidebar-close-btn').show(0);
    }
    else {
      $('.sidebar-menu-btn').show(0);
    }
  }
  $('.sidebar-menu-btn').on('click', function() {
    $('.sidebar-close-btn').show(0);
    $(this).hide(0);

    $(this).parent().addClass("active");
  });

  $('.sidebar-close-btn').on('click', function() {
    $('.sidebar-menu-btn').show(0);
    $(this).hide(0);

    $(this).parent().removeClass("active");
  })
}


$(function() {
  responsiveSidebar();

  $(window).resize(function() {
    responsiveSidebar();
  })
})