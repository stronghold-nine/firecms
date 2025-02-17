import React from "react";
// @ts-ignore
import featuresBg from "@site/static/img/features-bg.png";
// @ts-ignore
import featuresElement from "@site/static/img/features-element.png";

// @ts-ignore
import ReactLogo from "@site/static/img/reactjs-icon.svg";
// @ts-ignore
import FireCMSLogo from "@site/static/img/firecms_logo.svg";
// @ts-ignore
import FirebaseLogo from "@site/static/img/firebase.svg";

function FirebaseIntro() {
    return (
        <section className="relative">

            <div className="relative max-w-6xl mx-auto px-4 sm:px-6">

                <div
                    className="relative flex justify-center mb-12"
                    data-aos="fade-up"
                    data-aos-delay="150"
                >
                    <div
                        className="flex flex-row space-x-2 md:space-x-8 justify-center items-center">
                        <ReactLogo
                            style={{
                                width: 150,
                                height: 150,
                                maxWidth: "35%"
                            }}/>
                        <FirebaseLogo
                            style={{
                                width: 130,
                                height: 150,
                                maxWidth: "30%"
                            }}/>
                        <FireCMSLogo
                            style={{
                                width: 140,
                                height: 140,
                                maxWidth: "35%"
                            }}/>
                    </div>
                </div>

                <div
                    className="max-w-3xl mx-auto text-center pb-36 md:pb-40"
                    data-aos="fade-up"
                    data-aos-delay="100">
                    <h1 className="h2 mb-4">
                        Don't build another admin tool
                    </h1>
                    <p className="text-xl text-gray-600">
                        <b>FireCMS</b> is an open source CMS built by <b>developers
                        for developers</b>.
                        <br/>
                        Get a back office app for your Firebase project in
                        <b> no time</b>.
                    </p>
                    <div
                        className="mt-6 flex justify-center items-center flex-wrap"
                    >

                        <iframe className="mr-1 mb-2"
                                style={{transform: "scale(1.3)"}}
                                src="https://ghbtns.com/github-btn.html?user=Camberi&repo=FireCMS&type=star&count=true&size=large"
                                frameBorder="0" scrolling="0" width="160"
                                height="35" title="GitHub"/>

                        <a className="ml-1 mb-2"
                           href="https://www.producthunt.com/posts/firecms?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-firecms"
                           target="_blank">
                            <img
                                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=297888&theme=dark"
                                alt="FireCMS - An open source CMS and admin panel based on Firestore | Product Hunt"
                                style={{
                                    width: 190, height: "40px"
                                }}
                                width="190"
                                height="40"/>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default FirebaseIntro;
