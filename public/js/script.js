let addimage = document.getElementById('addimage')

let imglist = document.querySelector('.imglist')

let addimg = document.querySelectorAll('.addimg')[0]

addimage.addEventListener('click', function(){
    let newImage = addimg.cloneNode(true)
    let input = newImage.getElementsByTagName('input')[0];
    input.value= ""
    imglist.appendChild(newImage)
})