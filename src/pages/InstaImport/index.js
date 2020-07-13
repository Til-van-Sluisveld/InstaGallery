import React, { useState } from "react";
import { Jumbotron, Container, Row, Col } from "react-bootstrap";
import Axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "../../store/user/selectors";
import { importPhoto } from "../../store/photo/actions";
import "./styling.css";

export default function InstaImport() {
  const [handle, set_handle] = useState("");
  const [feed, set_feed] = useState([]);

  const [photosImported, set_photosImported] = useState(false);

  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  async function instagramPhotos(get_handle) {
    // It will contain our photos' links
    const res = [];

    try {
      const userInfoSource = await Axios.get(
        `https://www.instagram.com/${get_handle}/`
      );
      // userInfoSource.data contains the HTML from Axios
      const jsonObject = userInfoSource.data
        .match(
          /<script type="text\/javascript">window\._sharedData = (.*)<\/script>/
        )[1]
        .slice(0, -1);

      const userInfo = JSON.parse(jsonObject);
      // Retrieve only the first 12 results
      const mediaArray = userInfo.entry_data.ProfilePage[0].graphql.user.edge_owner_to_timeline_media.edges.splice(
        0,
        12
      );
      console.log("mediaArray:", mediaArray);
      for (let media of mediaArray) {
        const node = media.node;

        // Process only if is an image
        if (node.__typename && node.__typename !== "GraphImage") {
          continue;
        }

        // Push the photo data in the array
        res.push({
          description: node.edge_media_to_caption.edges[0].node.text,
          info: node.accessibility_caption,
          src: node.thumbnail_src,
        });
      }
    } catch (e) {
      console.error("Unable to retrieve photos. Reason: " + e.toString());
    }

    return res;
  }

  async function submit(event) {
    event.preventDefault();
    console.log("handle looking for:", handle);
    set_feed(await instagramPhotos(handle));
  }

  function cancelImport() {
    set_feed([]);
  }
  function importPhotos() {
    feed.map((photo) => {
      dispatch(importPhoto(photo.description, photo.info, photo.src, user.id));
    });
    set_photosImported(true);
  }
  //   console.log(feed);

  const inputFieldsToRender = () => {
    return (
      <div className="importPhotos">
        <form>
          <label htmlFor="instaHandle">Instagram name:</label>
          <br />
          <input
            type="text"
            id="instaHandle"
            name="instaHandle"
            value={handle}
            onChange={(e) => set_handle(e.target.value)}
          />
          <br />
          <button onClick={submit}>Find</button>
        </form>
      </div>
    );
  };

  const importPreview = () => {
    return (
      <div>
        {feed.map((photo, index) => {
          return (
            <img
              src={photo.src}
              alt={photo.info}
              key={index}
              style={{ width: "32%", margin: "5px" }}
            />
          );
        })}
        <div className="importPhotos">
          <Row>
            <Col>
              <button onClick={importPhotos}>Import</button>
            </Col>
            <Col>
              <button onClick={cancelImport}>Cancel</button>
            </Col>
          </Row>
        </div>
      </div>
    );
  };

  const importSuccesMessage = () => {
    return (
      <div>
        <h2>Succes</h2>
        <p>You're photo's have been imported to your gallery</p>
      </div>
    );
  };

  return (
    <div>
      <Jumbotron>
        <h1>Import pictures from Instagram</h1>
      </Jumbotron>
      <Container>
        {photosImported
          ? importSuccesMessage()
          : feed.length
          ? importPreview()
          : inputFieldsToRender()}
      </Container>
    </div>
  );
}
