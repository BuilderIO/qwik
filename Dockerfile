FROM node:16.12.0-buster

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
RUN mkdir -p /opt/qwik
ADD Makefile /opt/qwik
WORKDIR /opt/qwik
ENV PATH="/root/.cargo/bin:${PATH}"
RUN make install-rust-deps

ADD . /opt/qwik
RUN yarn install