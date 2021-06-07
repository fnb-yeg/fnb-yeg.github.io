# Beginner's Guide to Git

There are a lot of great git tutorials out there. Feel free to look up any concepts for further reading or follow along with a different tutorial. I've tried to simplify this down to the bare bones, anyone-can-do-these-steps, as much as possible, but of course everyone learns slightly differently. 

Give yourself patience and time to figure it out. 

Don't get frustrated with yourself if the concepts seem weird at first. Don't be upset with yourself if things go wrong. If you get stuck, you can try googling your problem, searching up different tutorials, or reach out for help.  

Here's an article about why contributing to open source is cool, how the skills you already have could be useful in the open source world, and what sort of projects to look for: https://opensource.guide/how-to-contribute/ . I find it's nice to motivate myself a bit before learning a new skill, but it's not required reading.

Here's an article that's more about the nuts and bolts of contributing to a new project: https://daily.dev/blog/how-to-contribute-to-open-source-projects-as-a-beginner . It'll probably be useful to read through. 

1. First, you will need to download and install git. 
For windows 10: https://www.thewindowsclub.com/how-to-download-and-install-git-in-windows-10
For mac: 
https://phoenixnap.com/kb/install-git-on-mac

2. Now that git is installed, go to this project's repository main page and click on the fork button to fork the project. This means that you get a version of the project on your github account.

3. Git uses SSH for authentication. They've deprecated https. This is sort of a pain in the ass for us, but I guess it's more secure. You can try and do the https thing, but I always end up with problems down the road and have to switch to ssh anyway. So it's a bit of a pain now but it'll make life easier later. 
Here is a good tutorial for generating ssh keys: https://docs.github.com/en/github/authenticating-to-github/connecting-to-github-with-ssh/about-ssh . Follow it to check for existing ssh keys, generate a new key and add it to the ssh-agent, add a new ssh key to your GitHub account, and then test your connection. 

4. Now that you have a forked version of the project, and you have your ssh keys set up, you need to clone it so that you have a copy of it on your machine. 

Here is a tutorial: https://www.toolsqa.com/git/clone-repository-using-ssh/ but I've listed the bare-bones steps below: 

Go to the repository on YOUR GitHub profile and click on the green button saying "Code". Click the button for "ssh" because that is what we are using. Copy the link there (there should be a "copy to clipboard" button). 

Open Git Bash. Navigate to your "Documents" directory with `cd Documents`. (Or whichever folder you'd like to save the project folder to). Enter `ls` to see a list of the existing files in this directory.

Type the following command to clone the repository to your computer: `git clone <copied_link>`. Once the command is done running, enter `ls` again. There should be a new folder, which contains the project. 

5. Now you're all set up to make changes! Look to the README for a guide on adding a new page or adding a news item to the news page. Once you're done:

6. `git add .` to add all the changes you've made to a changelist.
7. `git commit -m "<a message that describes your changes>"` to commit the changelist. 
8. `git push` to push the changes
9. Submit a pull request (PR). You can also shoot me a message asking me to merge your code. 

