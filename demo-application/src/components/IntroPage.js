import Button from "./Button";
import crane from "../civilWarImages/crane.jpg"
import crane2 from "../civilWarImages/crane2.jpg"
// import one from "../civilWarImages/1.png"
// import onePic from './37.png'
import home from '../images/home.png'
import Icon from "./Icon";

const IntroPage = () => {
  let randomText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Egestas erat imperdiet sed euismod nisi porta lorem mollis aliquam. Neque volutpat ac tincidunt vitae semper. Ac tortor dignissim convallis aenean et. Sollicitudin nibh sit amet commodo nulla facilisi. Facilisi cras fermentum odio eu feugiat. Posuere sollicitudin aliquam ultrices sagittis orci a scelerisque. Accumsan tortor posuere ac ut consequat semper. Aliquet nibh praesent tristique magna sit amet. Egestas erat imperdiet sed euismod nisi porta lorem mollis. Auctor elit sed vulputate mi sit. In iaculis nunc sed augue lacus viverra vitae."
  randomText = randomText + randomText + randomText+ randomText + randomText + randomText + randomText
  return (
    <div className='bookContainerIntro'>
        <div className='book'>
            <div className="intro">
                <h2 id="item">Introduction</h2>
                <div className="craneImg" id="item">
                    {/* <Icon image={crane2} name="home" /> */}
                    <img id='crane' src={crane}/>
                    <img id='crane' src={crane2} />
                </div>
                {/* <h3> Hello</h3> */}
                <p id="item">{randomText}</p>
            </div>
        </div>
    </div>
  )
};

export default IntroPage;
