const axios = require("axios");
require("dotenv").config();
const aufs = require("all-url-file-size");

exports.startApi = (req, res, next) => {
  res.status(200).json({ message: "Welcome To Vidown Api" });
};

exports.postYoutube = async (req, res, next) => {
  const ytUrl = req.body.urls; // URL from client
  let videoId = ytUrl.replace("https://www.youtube.com/watch?v=", "");
  videoId = videoId.replace("https://www.youtube.com/shorts/", "");
  videoId = videoId.replace("https://youtu.be/", "");
  videoId = videoId.replace("https://youtube.com/shorts/", "");
  videoId = videoId.replace("https://www.youtube.com/live/", "");
  videoId = videoId.slice(0, 11);

  const options = {
    method: "GET",
    url: `https://yt-api.p.rapidapi.com/dl?id=${arj7oStGLkU}`, // YouTube API URL
    headers: {
      "X-RapidAPI-Key": process.env.YT_API_KEY,
      "X-RapidAPI-Host": "yt-api.p.rapidapi.com",
    },
  };

  try {
    const response = await axios.request(options);
    const result = response.data;
    if (result.thumbnail) {
      let dataList = result.formats.map((obj) => {
        return {
          url: obj.url,
          quality: obj.qualityLabel,
          size: (
            (obj.bitrate * (+obj.approxDurationMs / 1000)) /
            (8 * 1024 * 1024)
          ).toFixed(1),
        };
      });

      res.status(200).json({
        thumb: result["thumbnail"][2].url,
        urls: dataList,
        title: result["title"],
      });

      req.users.addActivity({ yturl: ytUrl }).catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
    } else {
      res.status(403).json({
        status: "fail",
        error:
          "Sorry, we couldn't locate the video you're looking for. It's possible that the video is set to private or has been removed.",
        code: 403,
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "fail",
      error: "An unexpected error occurred. Please try again later.",
      code: 500,
    });
    const err = new Error(error);
    err.httpStatusCode = 500;
    return next(err);
  }
};

exports.postTwitter = async (req, res, next) => {
  const twUrl = req.body.urls;

  const options = {
    method: "POST",
    url: "https://twitter154.p.rapidapi.com/api/twitter/links",
    headers: {
      "content-type": "application/json",
      "X-RapidAPI-Key": process.env.TW_API_KEY,
      "X-RapidAPI-Host": "twitter154.p.rapidapi.com",
    },
    data: {
      url: twUrl,
    },
  };

  try {
    axios
      .request(options)
      .then((response) => {
        const data = response.data;
        let dataList = [];

        let dataUrl = data[0].urls;

        for (let i = 0; i < dataUrl.length; i++) {
          aufs(dataUrl[i].url, "MB")
            .then((size) => {
              dataList.push({
                url: dataUrl[i].url,
                quality: dataUrl[i].subName + "P",
                size: size.toFixed(1),
              });
            })
            .then((result) => {
              console.log(dataList);
              if (dataList.length === dataUrl.length) {
                res.status(200).json({
                  thumb: data[0]["pictureUrl"],
                  urls: dataList,
                  title: data[0]["meta"]["title"],
                });
                req.users
                  .addActivity({ twUrl: twUrl })
                  .then((result) => {
                    console.log(result);
                  })
                  .catch((err) => {
                    const error = new Error(err);
                    error.httpStatusCode = 500;
                    return next(error);
                  });
              }
            });
        }
      })
      .catch((err) => {
        res.status(403).json({
          status: "fail",
          error:
            "Sorry, we couldn't locate the video you're looking for. It's possible that the video is set to private or has been removed.",
          code: 403,
        });

        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "fail",
      error: "An unexpected error occurred. Please try again later.",
      code: 500,
    });
    const err = new Error(error);
    err.httpStatusCode = 500;
    return next(err);
  }
};

exports.postFb = (req, res, next) => {
  const fbUrl = req.body.urls;
  const options = {
    method: "GET",
    url: "https://facebook-video-audio-download.p.rapidapi.com/api/getSocialVideo",
    params: {
      url: fbUrl,
    },
    headers: {
      "X-RapidAPI-Key": process.env.FB_API_KEY,
      "X-RapidAPI-Host": "facebook-video-audio-download.p.rapidapi.com",
    },
  };

  try {
    axios
      .request(options)
      .then((response) => {
        const dataList = response.data;
        const format = dataList.links;

        if (dataList.error === true) {
          return res.status(403).json({
            status: "fail",
            error:
              "Sorry, we couldn't locate the video you're looking for. It's possible that the video is set to private or has been removed.",
            code: 403,
          });
        }

        console.log(dataList);

        let urls = [];

        format.forEach((data, index) => {
          aufs(data.link, "MB")
            .then((size) => {
              urls.push({
                url: data.link,
                quality: data.quality.toUpperCase(),
                size: size.toFixed(1),
              });
            })
            .then((result) => {
              if (urls.length === format.length) {
                res.status(200).json({
                  thumb: dataList["picture"],
                  urls: urls,
                  title: dataList["description"],
                });
                req.users
                  .addActivity({ fbUrl: fbUrl })
                  .then((result) => {
                    console.log(result);
                  })
                  .catch((err) => {
                    const error = new Error(err);
                    error.httpStatusCode = 500;
                    return next(error);
                  });
              }
            });
        });
      })
      .catch((err) => {
        res.status(403).json({
          status: "fail",
          error:
            "Sorry, we couldn't locate the video you're looking for. It's possible that the video is set to private or has been removed.",
          code: 403,
        });

        const error = new Error(err);
        error.httpStatusCode = 403;
        return next(error);
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "fail",
      error: "An unexpected error occurred. Please try again later.",
      code: 500,
    });
    const err = new Error(error);
    err.httpStatusCode = 500;
    return next(err);
  }
};

exports.otherPost = (req, res, next) => {
  const igUrl = req.body.urls;

  const options = {
    method: "GET",
    url: "https://facebook-video-audio-download.p.rapidapi.com/api/getSocialVideo",
    params: {
      url: igUrl,
    },
    headers: {
      "X-RapidAPI-Key": process.env.IG_API_KEY,
      "X-RapidAPI-Host": "facebook-video-audio-download.p.rapidapi.com",
    },
  };

  try {
    axios
      .request(options)
      .then((response) => {
        const formats = response.data;
        const videData = formats.links;

        if (formats.error === true) {
          return res.status(403).json({
            status: "fail",
            error:
              "Sorry, we couldn't locate the video you're looking for. It's possible that the video is set to private or has been removed.",
            code: 403,
          });
        }

        const urls = [];

        videData.forEach((data) => {
          aufs(data.link, "MB")
            .then((size) => {
              urls.push({
                url: data.link,
                quality:
                  data.quality.length > 1 ? data.quality.toUpperCase() : "720P",
                size: size.toFixed(1),
              });
            })
            .then((result) => {
              if (urls.length === videData.length) {
                res.status(200).json({
                  thumb: formats.picture,
                  urls: urls,
                  title: "Your IG Videos",
                });
                req.users
                  .addActivity({ igUrl: igUrl })
                  .then((result) => {
                    console.log("OK");
                  })
                  .catch((err) => {
                    const error = new Error(err);
                    error.httpStatusCode = 500;
                    return next(error);
                  });
              }
            });
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(403).json({
          status: "fail",
          error:
            "Sorry, we couldn't locate the video you're looking for. It's possible that the video is set to private or has been removed.",
          code: 403,
        });

        const error = new Error(err);
        error.httpStatusCode = 403;
        return next(error);
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "fail",
      error: "An unexpected error occurred. Please try again later.",
      code: 500,
    });
    const err = new Error(error);
    err.httpStatusCode = 500;
    return next(err);
  }
};
