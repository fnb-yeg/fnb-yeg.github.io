# This is the website for Food Not Bombs Edmonton. 

## This website allows us to share the work we do with the world, hopefully to inspire you, and includes a sign up page so that you can join us. 

View website here: https://edmonton.foodnotbombs.us

## To make changes to this website:

You'll need GitHub, a Text Editor and some basic understanding of HTML. We use Bootstrap to make everything look nice. 

### GitHub:
You will need to know how to use github. There is a bit of a learning curve, but the good news
is that it is industry-standard for version control in the software world. That means that if you
ever want to contribute to an open source project in the future (which are almost always looking for designers!) it will serve you, or even if you want to do any professional programming. 

Read through the beginners guide to git to get set up (or message me for help!) :) 

Don't worry about making mistakes or breaking things as you're developing! With git, I'll have to approve every pull request (PR) before your changes are applied to the actual website, and there's a complete history of every change made on our repository, so it's very easy to revert to old versions. Take chances, make mistakes, get messy. Have fun. 

### Text Editor
You'll also need a text editor you can use to edit the files (you will not be able to use microsoft word). If you don't have one already, I'd recommend atom. You can download it here: https://atom.io . You can also use Sublime (https://www.sublimetext.com/download) or Notepad++ https://notepad-plus-plus.org . 

### HTML
If you're totally unfamiliar with HTML, here is a short intro: https://html.com . You DO NOT have to learn everything on this page. Learn what a tag is. Learn what an attribute is. If you're keen, read through the Basic Construction of an HTML Page section, too. That'll get you through. 

### Extra Credit: Bootstrap
If you're interested in how it all looks so nice, the answer is with bootstrap. Bootstrap is a library for HTML/Javascript/CSS. Think of it as a bunch of pre-written bits of code. If you want to add something to the website and you can't find an existing bit of the website to copy-paste-change, you can google `bootstrap <the thing>` and it will show you how to add that thing. For example, to build the list shown on the "allies" page, I googled "bootstrap list", read through the bootstrap docs for the list, and then copy and pasted an example that I liked the look of and used that. If you read through the HTML and you're wondering what all the weird classes are doing, they're probably bootstrap classes, and you can google `bootstrap <the class name>` and you'll probably find information on it. 

### Making Changes:
#### Adding a new page: 
1. Decide on the name for the page. You want it short and easy to type. I'll use `my_example` for the purposes of this example. 

2. Create a new file. Name it `my_example.html`. Save it in the root folder for the project (fnb-yeg.github.io).

3. Open up template_page. Copy and paste it into your new file. Save the changes. 

4. Open up your File Explorer, navigate to the project folder, and double click the file you created (`my_example.html`.) It should open in your browser. Note that the images won't display.

5. Back in your text editor, scroll to where it says "Header Here". Put the name of your page there. For example, I'd remove `Header Here` and put `My Example` instead. Go to your browser and refresh the page. It should update "Header Here" to say "My Example".

6. Make your content! Write what you wanna write! Keep refreshing your page as you go so you can see the changes as you go. That way when you mess up you'll know right away. Plus it's rewarding when you can see what you're doing. 

7. Add a link to your page to the navigation bar: Scroll up to `<ul class="navbar-nav...`. Add 
```
<li class="nav-item">
	<a class="nav-link" href="/my_example">My Example</a>
</li>
```
To the list of links. (Refresh your page to see how it looks. Resize your browser window to see how it will look on mobile). Copy your list item. (Everything from the beginning of `<li>` to the end of `</li>`). Open up the `index.html` page and paste your list item into the navigation bar for the home page. (You can open up the index page in your browser to preview that change). Now add it to every other page. Don't forget to add it to the navigation on the template page so that when new pages are created your link will be there.

Go back to your new page. Change the `<a>` tag to `<a class="nav-link active" aria-current="page" href="#">My Example</a>` . Now when they are on your page, the navigation bar will show that they are on your page, and if they click it, it will keep them where they are. 

8. All done! Add, commit and push your changes. Then submit a Pull Request and shoot me a message and I'll merge your changes so that they show up on our website :) 

9. Note - If you're making a new page in a subdirectory, you'll have to change all the relative URLs.
This means - if you're making a new page and you save it as "new_page.html" (for example) in this folder, you can access it by opening up your page in a browser and your address displayed will look something like 
".../fnb-yeg.github.io/new_page.html" (and when your changes are merged it will show up as "edmonton.foodnotbombs.us/new_page" on the internet). However if you decide to add a new folder and save your new page there, the address will be ".../fnb-yeg.github.io/new_folder/new_page" (and similarly for accessing online after changes are merged). That new page is saved in subdirectory (subfolder) rather than root (this folder). 
Now there are a few places on the webpage that point to other spots in the project, either as links or as images, mostly. This looks like 'src="/some_relative_url"' or 'href=/some_relative_url' in an html tag. A relative url means that we are specifying where something is relative to the root of the project. The first slash means "the folder we are in" and then what comes after is pointing to a file name that is (hopefully) in the folder we are in. Compare to an absolute URL, e.g. https://www.google.com, which will point to the same place no matter where *we* are. 
Now if you were to copy and paste the template_page.html into a subdirectory, it has a bunch of relative urls. But because we have changed "the folder we are in", all those links will be broken!
The fix is simple once you understand the cause. ctrl+f in the file for all `src` attributes in the html and check if they are relative or absolute. If they are relative, change them so that they begin with `../`. Do the same for `href` attributes.

The recipe template does this for you already if you're adding a new recipe, so you shouldn't come across this. However if you're a beginner this would be a hard problem to troubleshoot so I wanted to make a note!

#### Adding a news item
1. Open news.html in your text editor.

2. The news page consists of `rows` of `cards`. With bootstrap, that looks like `<div class="row">` and `<div class="card">`. 
- The important thing when working with divs is to remember to close each tag. I'd recommend typing `</div>` as soon as you type in the `<div class="...">` so that you don't lose track. Then add in your content in the middle. 
- Also make sure that each card is in a row. If you want your card to be in its own row no matter the screen width, make your own row div and then put your card inside that. Otherwise add your card to an existing row. 

There is no limit to the number of cards you can put in a row. Bootstrap will decide, depending on width of the card and the width of the user's screen, how many to actually show in a row before wrapping it. You can play around with this by resizing your browser window.

3. If you want an image on your card, save a copy of it in the images folder. On the page where you would like the image to display, create an `<img>` tag. Create a `src=""` attribute within your image tag, and write the path to your image as the value for that attribute. Add an `alt=""` attribute to your image tag and describe the image. See html tutorials on inserting images for more details.  

4. This is what each card looks like in HTML. 
```
<div class="col-sm">
	<div class="card">
		<img class="card-img-top" src="/images/image_name.jpeg" alt="image description">
		<div class="card-body">
			<div class="d-flex w-100 justify-content-between">
				<h5 class="mb-1">Header</h5>
				<small>Date Goes Here</small>
			</div>
			<p class="mb-1">Card text goes here. This is a description of what is happening in the image, or what we want to announce.</p>
		</div>
	</div>
</div>
```
Note - some new features have been added to some cards since this tutorial was written. See "card_templates.html"
for a more in-depth description/explanation of each card. 

5. Copy and paste this card into your desired row (either newly created, or just at the beginning of an existing one). Open the news page in your browser to see how it looks.

6. To insert your image, in `<img>`, change the value of `src` to the name you saved your image under. Change the value `alt` to an image description (this is for screen readers and slow internet connections). If you do not want to insert an image, remove the `<img>` tag altogether.

7. Change "Header" to your desired header, type in your date instead of "Date", and edit the card text to whatever content you'd like. 

8. Refresh the page in your browser to see how it looks. 

9. Once you're happy with how it looks, add, commit and push your changes. Then either submit a PR or shoot me a message and I'll merge your changes so that they show up on our website :) 



