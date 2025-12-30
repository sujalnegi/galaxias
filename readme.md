<div align="center">
  <img src="static/images/galaxias_title.svg" alt="Galaxias Logo" width="300"/>

---
 
**Galaxias is all you can think creative simulation and sandbox. It has two parts of it, First is the simulation page where you can explore a 3D simulation of our Solar System. Then we have the creative sandbox where user can make any simulation they want with their imagination.**

</div>

## Features

* **Solar System Simulation:**
    * **Interactive 3D Universe:** Explore a detailed 3D models of our solar system interacting with three.js
    * **Celestial Bodies:** Visualize accurate 3D models of Mercury, Venus, Earth, Mars, Jupiter, and other planets
    * **Time Manipulation:** Control the flow of time with features to reverse, pause, and speed up orbital mechanics
    * **Orbit Visualization:** View dynamic orbital paths and satellite trajectories (amazing povs)

* **Creative Sandbox:**
    * **Limitless Creation:** A dedicated space to build and simulate your own celestial arrangements.
    * **Custom Imports:** Upload and integrate your own `.glb` 3D models directly into the simulation.
    * **Advanced Object Control:**
        * **Transformation:** Move objects using arrow keys or precise coordinate inputs.
        * **Scaling:** Resize objects dynamically using the property panel or shortcuts.
        * **Animation:** Toggle spin and orbit animations for individual objects or globally.
    * **Scene Customization:**
        * **Environment:** Customize background colors and toggle starfields or grid helpers.
        * **Undo/Redo System:**  history management to revert or re-apply changes.
    * **Export:** screenshot functionality to capture and download your creations.


## Demo Video & Hosted Links

* Demo video is [here](https://drive.google.com/file/d/1hDwPmPVVhFQY3QD9q7nIaNym_Wc5gYZm/view?usp=drive_link)

**NOTE**: Long but thorough. I also made a mini simulation in the sandbox mode.

* Hosted link is [here](https://galaxias.onrender.com/)

**NOTE**: the site is hosted on Render's free tier subscription so it might take upto 5 mins to start up. I am sorry for the inconvinience :|

## Technologies Used

* **Backend:** Python, Flask
* **Frontend:** HTML5, CSS3, JavaScript
* **3D Rendering:** Three.js (WebGL)
* **Asset Loading:** GLTFLoader
* **Camera Control:** OrbitControls

## Local Setup and Installation

Follow these steps to get the application running on your local machine.

### 1. Prerequisites

* Python 3.7+
* `pip` (Python package installer)

### 2. Clone the Repository

Clone this repository to your local machine:

```bash
git clone https://github.com/sujalnegi/galaxias.git
cd galaxias
```

### 3. Install Dependencies

Install the requirements:

```bash
pip install requirements.txt
```

### 4. Run the Application

Start the Flask server:

```bash
python app.py
```

Now open your web browser and go to the following address:

```
http://127.0.0.1:5000/
```

You should see **Galaxias** running

## How to Use

1. **Start:** Click the "GO" button on the landing page to enter the simulation.
2. **Simulation Mode:** 
   - Navigate the solar system using your mouse (Left Click to Rotate, Scroll to Zoom, Right Click to Pan).
   - Use the control panel to adjust simulation speed and time direction.
3. **Sandbox Mode:**
   - **Add Objects:** Select planets from the left sidebar or upload custom `.glb` files.
   - **Manipulate:** Click an object to select it. Use the right sidebar properties panel to adjust position, scale, and speed.
   - **Controls:** Use on-screen buttons or keyboard shortcuts (Arrows for movement, `Space` for pause) to control the environment.

## Author

- Email: [sujal1negi@gmail.com](mailto:sujal1negi@gmail.com)
- Instagram: [@_sujal1negi_](https://www.instagram.com/_sujal1negi_/)


## Acknowledgments/Credits

- 3D models from NASA and sketchers from sketchlab
- Three.js community 
- Satelite Monitor repo from github
