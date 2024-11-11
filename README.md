Cobb website tutorial for updating the scan:
1. Go to github.com and log-in to the Cobb account
2. Go to the obj directory. You should see an .obj file, a .mtl file, and a .jpg file.
3. Export your scan as an mtl so that you have an obj/mtl/jpg.
4. Rename the .mtl and .obj file to "cobb.mtl" and "cobb.obj" but DO NOT change the name of the .jpg file from whatever your scanning software named it.
5. Replace the existing obj/mtl/jpg file on github with your new three files.
6. Go to the website to make sure things work. It can take a minute for Vercel (the web hosting service) to update. If you don't see anything, first try to look behind/below your. The position may be chosen poorly. If there's still nothing, use "inspect element" or "developer tools" in your web browser and look at the console. You should see something like "Failed to load resource: the server responded with a status of 404" and the name of the file that failed to load. Most likely the file is named incorrectly.

If the scan is too high/too low, or the scaling is too big/too small, change the renderer.js file.
Look for "object.position.set" or "object.scale.set" in the "loadCobbMtl" function.
Depending on the size of your scan, you may need to change the initial position. A negative y (height) and negative z (place scene in front of camera) is likely necessary.